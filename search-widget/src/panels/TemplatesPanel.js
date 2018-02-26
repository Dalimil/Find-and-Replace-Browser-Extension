import React from 'react';
import FontAwesome from 'react-fontawesome';

import Logger from '../Logger';
import Storage from '../Storage';
import ConnectionApi from '../ConnectionApi';
import Analytics from '../Analytics';

class TemplatesPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      templates: [],
      contentScript: {
        noCursorPosition: false,
        noCursorRange: true
      },
      originalTextTransformedText: null,
    }

    // Used to debounce template edit mode operations mapped by template id
    // and stores timeout id as the value
    this.templateEditDebouncers = {};

    this.handleTemplateSelected = this.handleTemplateSelected.bind(this);
    this.handleTemplateRemoved = this.handleTemplateRemoved.bind(this);
    this.handleTemplateStartEdit = this.handleTemplateStartEdit.bind(this);
    this.handleTemplateFinishEdit = this.handleTemplateFinishEdit.bind(this);
    this.handleTemplateEditUpdate = this.handleTemplateEditUpdate.bind(this);

    ConnectionApi.addResponseHandler(msg => {
      if (msg.reply == 'insertTemplate') {
        this.setState({
          contentScript: {
            noCursorPosition: msg.data.noCursorPosition,
            noCursorRange: msg.data.noCursorRange
          },
          originalTextTransformedText: msg.data.originalText
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
    // We want a non-changing ordering, so later edits modify ids in this array
    // but we do not reorder until the next tab reload (except when list length changes)
    const templateList = Object.keys(templates).map(templateId => {
      return Object.assign({}, templates[templateId], {
        id: templateId,
        isBeingEdited: false,
        isBeingSaved: false
      });
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
    if (templateText) {
      Analytics.sendEvent("templates", "template-pasted");
    }
  }

  handleTemplateRemoved(templateId) {
    Storage.removeTemplate(templateId);
  }

  getTemplateById(id) {
    const template = this.state.templates.find(template => {
      return template.id == id;
    });
    return template;
  }

  handleTemplateStartEdit(id) {
    const template = this.getTemplateById(id);
    if (template) {
      template.isBeingEdited = true;
    }
    this.forceUpdate();
  }

  handleTemplateFinishEdit(id) {
    const template = this.getTemplateById(id);
    if (template) {
      template.isBeingEdited = false;
    }
    this.forceUpdate();
  }

  handleTemplateEditUpdate(id, newTitle, newText) {
    const template = this.getTemplateById(id);
    if (!template) {
      return;
    }
    template.isBeingSaved = true;
    // Must be careful with '' string
    template.title = newTitle == null ? template.title : newTitle;
    template.text = newText == null ? template.text : newText;
    this.forceUpdate();

    // DEBOUNCE THE SAVE-TO-STORAGE PART
    window.clearTimeout(this.templateEditDebouncers[id]);
    this.templateEditDebouncers[id] = window.setTimeout(() => {
      delete this.templateEditDebouncers[id];
      // updateTemplate doesn't trigger observer notify() update
      const newTemplateId = Storage.updateTemplate(id, template.title, template.text);
      if (newTemplateId) {
        template.id = newTemplateId;
      }
      template.isBeingSaved = false;
      this.forceUpdate();
    }, 500);
  }

  handleCreateNewTemplate() {
    Storage.addToTemplates("(New Template) - Click the pencil icon to edit.",
      "This is the template text that will be pasted at your cursor location.");
    Analytics.sendEvent("templates", "new-template-created");
  }

  changeTextToLowerCase() {
    if (this.state.contentScript.noCursorRange) return;
    Logger.log(`Applying lower case transform template`);
    ConnectionApi.insertTemplate({
      text: "",
      lowerCaseTransform: true
    });
    Analytics.sendEvent("templates", "template-lower-case-applied");
  }

  changeTextToUpperCase() {
    if (this.state.contentScript.noCursorRange) return;
    Logger.log(`Applying upper case transform template`);
    ConnectionApi.insertTemplate({
      text: "",
      upperCaseTransform: true
    });
    Analytics.sendEvent("templates", "template-upper-case-applied");
  }

  revertToOriginalTextTransformedText() {
    if (!this.state.originalTextTransformedText) {
      return;
    }
    const templateText = this.state.originalTextTransformedText;
    Logger.log(`Reverting text transform template: "${templateText}"`);
    ConnectionApi.insertTemplate({
      text: templateText
    });
    Analytics.sendEvent("templates", "template-case-reversed");
  }

  renderTextCaseTransformationTemplates() {
    const RevertToOriginalTextButton = this.state.originalTextTransformedText && (
      <FontAwesome className="templates-list-item-lock" name='undo'
        title="Revert to original text"
        onClick={(e) => {
          e.stopPropagation();
          this.revertToOriginalTextTransformedText();
        }}
      />
    );

    const ToUpperCaseTemplate = (
      <div
        className="templates-list-item templates-list-item-themed"
        onClick={() => this.changeTextToUpperCase()}
      >
        <span title={`Transforms selected text to upper case`}>
          To UPPER case (transforms selected text)
        </span>
        <span>
          { RevertToOriginalTextButton }
        </span>
      </div>
    );
    const ToLowerCaseTemplate = (
      <div
        className="templates-list-item templates-list-item-themed"
        onClick={() => this.changeTextToLowerCase()}
      >
        <span title={`Transforms selected text to lower case`}>
          To LOWER case (transforms selected text)
        </span>
        <span>
          { RevertToOriginalTextButton }
        </span>
      </div>
    );
    return {
      ToUpperCaseTemplate,
      ToLowerCaseTemplate
    };
  }

  render() {
    const noSavedTemplatesMessage = <div style={{ padding: '1em' }}>
        Currently you have no saved templates.</div>;

    const ChangeTextCaseTemplates = this.renderTextCaseTransformationTemplates();
    return (
      <div className="templates-list">
        <div className="panel-title panel-title-extended">
          <span>
            <FontAwesome name='file-text' fixedWidth={true} />
            <span style={{ paddingRight: '10px' }}> Templates</span>
            {this.state.contentScript.noCursorPosition ?
              <span className="templates-panel-title-note-error">
                (Disabled - click inside editable text area)</span> :
              <span className="templates-panel-title-note-success">(Click to activate)</span>
            }
          </span>
          <span className="templates-create-new-button"
            onClick={this.handleCreateNewTemplate}>
            <FontAwesome name='plus' style={{ marginRight: '0.5em' }} />Create New
          </span>
        </div>
        <div>
          {!this.state.contentScript.noCursorRange && ChangeTextCaseTemplates.ToUpperCaseTemplate}
          {!this.state.contentScript.noCursorRange && ChangeTextCaseTemplates.ToLowerCaseTemplate}
          {this.state.contentScript.noCursorRange && this.state.templates.length == 0 &&
            noSavedTemplatesMessage}
          {this.state.templates.map((template, index) => {
            if (template.isBeingEdited) {
              return (
                <div className="templates-list-editable-item" key={index}>
                  <div className="templates-editable-header">
                    <input className="text-input templates-editable-title-input"
                      type="text"
                      spellCheck="false"
                      value={template.title}
                      onChange={(e) => {
                        this.handleTemplateEditUpdate(template.id, e.target.value, null);
                      }} />
                    <span>
                      <span className="templates-editable-item-save-status">
                        {template.isBeingSaved ? "Saving..." : "Saved"}
                      </span>
                      <FontAwesome className="templates-editable-item-cancel" name='compress'
                        onClick={() => {
                          this.handleTemplateFinishEdit(template.id);
                        }} />
                    </span>
                  </div>
                  <div className="templates-editable-body">
                    <textarea className="text-input templates-editable-textarea-input"
                      value={template.text}
                      onChange={(e) => {
                        this.handleTemplateEditUpdate(template.id, null, e.target.value);
                      }} />
                  </div>
                </div>
              );
            } else {
              return (
                <div className="templates-list-item" key={index}
                    onClick={() => {
                      if (!this.state.contentScript.noCursorPosition) {
                        this.handleTemplateSelected(template.text);
                      }
                    }}>
                  <span title={`Template: "${template.text}"`}>
                    {template.title}
                  </span>
                  <span>
                    <FontAwesome className="templates-list-item-edit" name='pencil'
                      onClick={(e) => {
                        e.stopPropagation();
                        this.handleTemplateStartEdit(template.id);
                      }} />
                    <FontAwesome className="templates-list-item-remove" name='times'
                      onClick={(e) => {
                        e.stopPropagation();
                        this.handleTemplateRemoved(template.id);
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
