const { expect } = require('chai')
const { describe, it } = require('mocha')
const Enzyme = require('enzyme')
const Adapter = require('enzyme-adapter-react-16')
const React = require('react')
const PropTypes = require('prop-types')
const { Provider } = require('mobx-react')
const { observable } = require('mobx')
const i18n = require('i18n-harmony')
const { jsdom } = require('jsdom')
const { init, translatable, tFactory, hasFactory } = require('./index')

Enzyme.configure({ adapter: new Adapter() })

const exposedProperties = ['window', 'navigator', 'document']

function initMockDOM() {
    global.document = jsdom('')
    global.window = document.defaultView
    Object.keys(document.defaultView).forEach((property) => {
        if (typeof global[property] === 'undefined') {
            exposedProperties.push(property)
            global[property] = document.defaultView[property]
        }
    })

    global.navigator = {
        userAgent: 'node.js'
    }
}

describe('react-mobx-translatable', function () {
    beforeEach(function () {
        i18n.init({
            translations: {
                en: { hello: 'Hello' },
                de: { hello: 'Hallo' }
            }
        })
        initMockDOM()
    })

    it('should work with default configuration', function () {
        const store = {
            i18n: observable({ locale: 'en' })
        }
        init()

        class MyComponent extends React.Component {
            render() {
                return <div>{this.t('hello')}</div>
            }
        }
        const MyWrappedComponent = translatable(MyComponent)

        const wrapper = Enzyme.mount(<Provider {...store}><MyWrappedComponent /></Provider>)

        expect(wrapper.find('div').first().text()).to.equal('Hello')

        store.i18n.locale = 'de'
        expect(wrapper.find('div').first().text()).to.equal('Hallo')
    })

    it('should work with custom store configuration', function () {
        const store = {
            ui: {
                i18n: observable({ locale: 'en' })
            }
        }
        init((store) => ({ i18n: store.ui.i18n }))

        class MyComponent extends React.Component {
            render() {
                return <div>{this.t('hello')}</div>
            }
        }
        const MyWrappedComponent = translatable(MyComponent)

        const wrapper = Enzyme.mount(<Provider {...store}><MyWrappedComponent /></Provider>)

        expect(wrapper.find('div').first().text()).to.equal('Hello')

        store.ui.i18n.locale = 'de'
        expect(wrapper.find('div').first().text()).to.equal('Hallo')
    })

    it('should work with custom connectors', function () {
        const store = {
            data: observable({
                foo: 1
            }),
            ui: {
                i18n: observable({ locale: 'en' })
            }
        }
        init((store) => ({ i18n: store.ui.i18n }))

        class MyComponent extends React.Component {
            render() {
                expect(this.props.data).to.be.an('object')

                return <div>{this.t('hello')}</div>
            }
        }
        MyComponent.propTypes = {
            data: PropTypes.object
        }
        const MyWrappedComponent = translatable(['data'])(MyComponent)

        const wrapper = Enzyme.mount(<Provider {...store}><MyWrappedComponent /></Provider>)

        expect(wrapper.find('div').first().text()).to.equal('Hello')

        store.ui.i18n.locale = 'de'
        expect(wrapper.find('div').first().text()).to.equal('Hallo')
    })

    it('has should return if translation exists', function () {
        let helloExists = false
        const store = {
            i18n: observable({ locale: 'en' })
        }
        init()

        class MyComponent extends React.Component {
            componentWillMount() {
                const existsKey = this.has('hello')
                const doesntExistsKey = this.has('unknown-key')

                expect(existsKey).to.be.eq(true)
                expect(doesntExistsKey).to.be.eq(false)
            }

            render() {
                return <div>{this.t('hello')}</div>
            }
        }
        const MyWrappedComponent = translatable(MyComponent)

        const wrapper = Enzyme.mount(<Provider {...store}><MyWrappedComponent /></Provider>)
    })

    it('should provide factory for translation function', function () {
        const store = {
            i18n: observable({ locale: 'en' })
        }
        init()

        expect(tFactory(store.i18n)('hello')).to.equal('Hello')
    })

    it('should provide factory for has-translation function', function () {
        const store = {
            i18n: observable({ locale: 'en' })
        }
        init()

        expect(hasFactory(store.i18n)('hello')).to.be.true
    })
})
