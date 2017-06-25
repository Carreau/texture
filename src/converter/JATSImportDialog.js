import { Component } from 'substance'
import { JATS, restrictedJATS, TextureJATS } from '../article'

export default class JATSImportDialog extends Component {

  render($$) {
    const importer = this.props.importer
    let el = $$('div').addClass('sc-jats-import-dialog')

    el.append($$('h1').addClass('se-title').text('Importing JATS'))

    // parsing XML
    el.append($$(ImportStage, {importer, stage: `parse`}))
    // validating JATS
    el.append($$(ImportStage, {importer, stage: `validate-${JATS.getName()}`}))
    // transforming JATS -> restricted JATS
    el.append($$(ImportStage, {importer, stage: `j2r`}))
    // validating restricted JATS
    el.append($$(ImportStage, {importer, stage: `validate-${restrictedJATS.getName()}`}))
    // transforming restricted JATS -> TextureJATS
    el.append($$(ImportStage, {importer, stage: `r2t`}))
    // validating TextureJATS
    el.append($$(ImportStage, {importer, stage: `validate-${TextureJATS.getName()}`}))

    return el
  }

}

class ImportStage extends Component {

  didMount() {
    this.props.importer.on(`begin:${this.props.stage}`, this._onBegin, this)
    this.props.importer.on(`error:${this.props.stage}`, this._onError, this)
    this.props.importer.on(`end:${this.props.stage}`, this._onEnd, this)
  }

  getInitialState() {
    return {
      state: 'initial'
    }
  }

  render($$) {
    const { state, errors } = this.state
    let el = $$('div').addClass('sc-import-stage')

    el.append($$('h2').addClass('se-title').text(_getTitle(this.props.stage)))

    el.addClass(`sm-${state}`)
    if (errors) {
      let errorsEl = $$('div').addClass('se-errors')
      errors.forEach((err) => {
        errorsEl.append(this._renderError($$, err))
      })
      el.append(errorsEl)
    }
    return el
  }

  _renderError($$, err) {
    let el = $$('div').addClass('se-error')
    // TODO: maybe we will have more structured errors
    el.append(String(err))
    return el
  }

  _onBegin() {
    this.extendState({ state: 'started' })
  }

  _onError(err) {
    let errors = (this.state.errors || []).concat([err])
    this.extendState({ state: 'errored', errors })
  }

  _onEnd() {
    this.extendState({ state: 'finished' })
  }

}

const TITLES = {
  'parse': 'Parse XML',
  'validate-jats': 'Validate JATS',
  'validate-restricted-jats': 'Validate restricted JATS',
  'validate-texture-jats': 'Validate Texture JATS',
  'j2r': 'Transform JATS -> restricted JATS',
  'r2t': 'Transform restricted JATS -> TextureJATS'
}

function _getTitle(stage) {
  return TITLES[stage]
}