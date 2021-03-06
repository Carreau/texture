import { NodeComponent, without } from 'substance'

class RefListComponent extends NodeComponent {

  didMount() {
    super.didMount()
    this.context.labelGenerator.on('labels:generated', this._onLabelsChanged, this)

    this.handleActions({
      'removeRef': this._removeRef
    })
  }

  dispose() {
    super.dispose()
    this.context.labelGenerator.off(this)
  }

  render($$) {
    const labelGenerator = this.context.labelGenerator
    const node = this.props.node

    let el = $$('div').addClass('sc-ref-list')
    // NOTE: We don't yet expose RefList.label to the editor
    let title = node.find('title')
    if (title) {
      el.append(
        $$('div').addClass('se-title').append(
          $$(this.getComponent('text-property-editor'), {
            path: title.getTextPath(),
            disabled: this.props.disabled
          })
        )
      )
    }
    let refs = node.findAll('ref')
    let entries = refs.map((ref) => {
      return {
        // NOTE: refs without a position, i.e. which are not referenced
        // should end up at the end of the list
        pos: labelGenerator.getPosition('bibr', ref.id) || Number.MAX_VALUE,
        ref
      }
    })
    entries.sort((a,b) => {
      return a.pos - b.pos
    })
    entries.forEach((entry) => {
      const ref = entry.ref
      let RefComponent = this.getComponent('ref')
      el.append(
        $$(RefComponent, { node: ref }).ref(ref.id)
      )
    })

    el.append(
      $$('div').append(
        $$('button').addClass('sg-big-button')
          .append('Add Reference')
          .on('click', this._addRef)
      )
    )
    return el
  }

  _onLabelsChanged(refType) {
    if (refType === 'bibr') {
      this.rerender()
    }
  }

  /*
    Insert new Reference

    <ref>
      <string-citation>Please enter publication name</string-citation>
    </ref>
  */
  _addRef() {
    const editorSession = this.context.editorSession
    editorSession.transaction((doc) => {
      let refList = doc.find('ref-list')
      let ref = doc.createElement('ref')
      let stringCitation = doc.createElement('string-citation')
      ref.append(stringCitation)
      refList.append(ref)
    })
    this.rerender()
  }

  _removeRef(refId) {
    let editorSession = this.context.editorSession
    editorSession.transaction(doc => {
      let xrefIndex = doc.getIndex('xrefs')
      let xrefs = xrefIndex.get(refId)
      xrefs.forEach((xrefId) => {
        let xref = doc.get(xrefId)
        let idrefs = xref.attr('rid').split(' ')
        idrefs = without(idrefs, refId)
        xref.setAttribute('rid', idrefs.join(' '))
      })
      let fnGroup = doc.find('ref-list')
      let ref = fnGroup.find(`ref#${refId}`)
      fnGroup.removeChild(ref)
    })
    this.rerender()
  }

}


export default RefListComponent
