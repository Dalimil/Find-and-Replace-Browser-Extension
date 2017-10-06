import React from 'react';
import FontAwesome from 'react-fontawesome';

import Storage from '../Storage';

class TemplatesPanel extends React.Component {
  constructor(props) {
    super(props);

    this.handleTemplateSelected = this.handleTemplateSelected.bind(this);
    this.handleTemplateRemoved = this.handleTemplateRemoved.bind(this);
    this.handleTemplateStartEdit = this.handleTemplateStartEdit.bind(this);
  }

  handleTemplateSelected(templateText) {
    this.props.onTemplateSelected(templateText);
  }

  handleTemplateRemoved(templateId) {
    Storage.removeTemplate(templateId);
  }

  handleTemplateStartEdit(title, text) {
    // todo
  }

  handleTemplateFinishEdit() {

  }

  handleCreateNewTemplate() {
    Storage.addToTemplates(" New Template - Click the pencil icon to edit.",
      "This is the template text that will be pasted at your cursor location.");
  }

  render() {
    const noSavedTemplatesMessage = <div style={{ padding: '1em' }}>
        Currently you have no saved templates.</div>;
    const templatesDisabledMessage = <div style={{ padding: '1em', color: '#e22' }}>
        Templates disabled. You must select an editable text area in the page first.</div>;

    return (
      <div className="templates-list">
        <div className="panel-title">
          <span><FontAwesome name='file-text' fixedWidth={true} /> Templates (click to paste)</span>
          <span className="templates-create-new-button"
            onClick={this.handleCreateNewTemplate}>
            <FontAwesome name='plus' style={{ marginRight: '0.5em' }} />Create New
          </span>
        </div>
        <div>
          {this.props.templates.length == 0 && noSavedTemplatesMessage}
          {this.props.templatesDisabled && templatesDisabledMessage}
          {this.props.templates.map(({ title, text, id }) => {
            return (
              <div className="templates-list-item" key={id}
                  onClick={() => {
                    if (!this.props.templatesDisabled) {
                      this.handleTemplateSelected(text);
                    }
                  }}>
                <span title={`Template: "${text}"`}>
                  {title}
                </span>
                <span>
                  <FontAwesome className="templates-list-item-edit" name='pencil'
                    style={{ marginRight: '10px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      this.handleTemplateStartEdit(title, text);
                    }} />
                  <FontAwesome className="templates-list-item-remove" name='times'
                    onClick={(e) => {
                      e.stopPropagation();
                      this.handleTemplateRemoved(id);
                    }} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

}

export default TemplatesPanel;
