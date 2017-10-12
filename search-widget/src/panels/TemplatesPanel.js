import React from 'react';
import FontAwesome from 'react-fontawesome';

import Logger from '../Logger';
import Storage from '../Storage';
import ConnectionApi from '../ConnectionApi';

class TemplatesPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      templates: [],
      contentScript: {
        noCursorPosition: false
      }
    }

    // Save uncontrolled component by id
    this.titleInputs = {};
    this.textareaInputs = {};

    this.handleTemplateSelected = this.handleTemplateSelected.bind(this);
    this.handleTemplateRemoved = this.handleTemplateRemoved.bind(this);
    this.handleTemplateStartEdit = this.handleTemplateStartEdit.bind(this);
    this.handleTemplateCancelEdit = this.handleTemplateCancelEdit.bind(this);
    this.handleTemplateSaveEdit = this.handleTemplateSaveEdit.bind(this);

    ConnectionApi.addResponseHandler(msg => {
      if (msg.reply == 'insertTemplate') {
        this.setState({
          contentScript: { noCursorPosition: msg.data.noCursorPosition }
        });
        if (!msg.data.noCursorPosition) {
          // No error, signal template insertion success
          this.props.onTemplateSelected();
        }
      }
    });
  }

  componentDidMount() {
    Storage.observeOnTemplatesChanged(this.onTemplatesChanged.bind(this));
    // Obtain and show immediate status => templates enabled/disabled
    this.handleTemplateSelected("");
  }

  onTemplatesChanged(templates) {
    // Sort templates by title (and keep their id)
    const templateList = Object.keys(templates).map(templateId => {
      return Object.assign({}, templates[templateId], { id: templateId, isBeingEdited: false });
    }).sort((a, b) => {
      const titleA = a.title.toUpperCase();
      const titleB = b.title.toUpperCase();
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    });
    Logger.log("Got templates update: ", templates, templateList);
    this.setState({ templates: templateList });
  }

  handleTemplateSelected(templateText) {
    Logger.log(`Pasting template: "${templateText}"`);
    ConnectionApi.insertTemplate({
      text: templateText
    });
  }

  handleTemplateRemoved(templateId) {
    Storage.removeTemplate(templateId);
  }

  handleTemplateStartEdit(id) {
    const template = this.state.templates.find(template => {
      return template.id == id;
    });
    if (template) {
      template.isBeingEdited = true;
    }
    this.forceUpdate();
  }

  handleTemplateCancelEdit(id) {
    const template = this.state.templates.find(template => {
      return template.id == id;
    });
    if (template) {
      template.isBeingEdited = false;
    }
    this.forceUpdate();
  }

  handleTemplateSaveEdit(id) {
    const newTitle = this.titleInputs[id].value;
    const newText = this.textareaInputs[id].value;
    // Storage update will reset isBeingEdited to false for all
    Storage.removeTemplate(id).then(() => {
      Storage.addToTemplates(newTitle, newText);
    });
  }

  handleCreateNewTemplate() {
    Storage.addToTemplates("(New Template) - Click the pencil icon to edit.",
      "This is the template text that will be pasted at your cursor location.");
  }

  render() {
    const noSavedTemplatesMessage = <div style={{ padding: '1em' }}>
        Currently you have no saved templates.</div>;

    return (
      <div className="templates-list">
        <div className="panel-title panel-title-extended">
          <span>
            <FontAwesome name='file-text' fixedWidth={true} />
            <span style={{ paddingRight: '10px' }}> Templates</span>
            {this.state.contentScript.noCursorPosition ?
              <span className="templates-panel-title-note-error">
                (Disabled - click inside editable text area first)</span> :
              <span className="templates-panel-title-note-success">(Click to paste)</span>
            }
          </span>
          <span className="templates-create-new-button"
            onClick={this.handleCreateNewTemplate}>
            <FontAwesome name='plus' style={{ marginRight: '0.5em' }} />Create New
          </span>
        </div>
        <div>
          {this.state.templates.length == 0 && noSavedTemplatesMessage}
          {this.state.templates.map(({ title, text, id, isBeingEdited }) => {
            if (isBeingEdited) {
              return (
                <div className="templates-list-editable-item" key={id}>
                  <div className="templates-editable-header">
                    <input className="text-input templates-editable-title-input"
                      type="text"
                      spellCheck="false"
                      defaultValue={title}
                      ref={input => { this.titleInputs[id] = input; }}/>
                    <span>
                      <FontAwesome className="templates-editable-item-save" name='check'
                        onClick={() => {
                          this.handleTemplateSaveEdit(id);
                        }} />
                      <FontAwesome className="templates-editable-item-cancel" name='times'
                        onClick={() => {
                          this.handleTemplateCancelEdit(id);
                        }} />
                    </span>
                  </div>
                  <div className="templates-editable-body">
                    <textarea className="text-input templates-editable-textarea-input"
                      defaultValue={text}
                      ref={input => { this.textareaInputs[id] = input; }}/>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="templates-list-item" key={id}
                    onClick={() => {
                      if (!this.state.contentScript.noCursorPosition) {
                        this.handleTemplateSelected(text);
                      }
                    }}>
                  <span title={`Template: "${text}"`}>
                    {title}
                  </span>
                  <span>
                    <FontAwesome className="templates-list-item-edit" name='pencil'
                      onClick={(e) => {
                        e.stopPropagation();
                        this.handleTemplateStartEdit(id);
                      }} />
                    <FontAwesome className="templates-list-item-remove" name='times'
                      onClick={(e) => {
                        e.stopPropagation();
                        this.handleTemplateRemoved(id);
                      }} />
                  </span>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  }

}

export default TemplatesPanel;
