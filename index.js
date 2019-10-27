import { VueInstaller } from '@ezraobiwale/dpd'
import Documents from './Documents'
import Document from './Document'


export default {
    install(Vue, transport, socketIO) {
        if (!Vue.prototype.$dpd) {
            if (!transport) {
                throw new Error('Http transport must be provided')
            }

            VueInstaller.install(Vue, transport, socketIO)
        }

        Vue.component('dpd-documents', Documents)
        Vue.component('dpd-document', Document)
    }
}