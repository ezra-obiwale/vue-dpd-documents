<template>
  <div>
    <slot :document="document" :working="working" />
  </div>
</template>

<script>
export default {
  name: 'DpdDocumentComponent',
  docInfo: {
    description: 'Loads a document',
    slots: {
      default: {
        description: 'The default slot',
        scopedValues: {
          document: {
            type: Object,
            description: 'The loaded document.'
          },
          working: {
            type: Boolean,
            description: 'Indicates when the document is being loaded.'
          }
        }
      }
    },
    methods: {
      load: {
        description: 'Loads the document',
        params: [
          {
            type: Function,
            description: 'The function to call when the document has been loaded.'
          }
        ],
        events: {
          loadError: {
            description: 'Emitted when there is an error when loading the document.',
            value: {
              type: Error,
              description: 'The error message received.'
            }
          },
          loadOK: {
            description: 'Emitted when the document has been loaded.',
            value: {
              type: Object,
              description: 'The loaded document.'
            }
          }
        }
      },
      refresh: {
        description: 'Clears the loaded document, if any, and then calls method load().'
      },
      remove: {
        description: 'Removes the document.',
        events: {
          removeError: {
            description: 'Emitted when there is an error when removing the document.',
            value: {
              type: Error,
              description: 'The error.'
            }
          },
          removeOK: {
            description: 'Emitted when the document is removed successfully.',
            value: {
              type: Object,
              description: 'The removed document.'
            }
          }
        }
      },
      save: {
        description: 'Saves the document.',
        params: [
          {
            type: Object,
            description: 'The document to save.'
          }
        ],
        events: {
          saveError: {
            description: 'Emitted when there is an error when saving the document.',
            value: {
              type: Error,
              description: 'The error.'
            }
          },
          saveOK: {
            description: 'Emitted when the document is saved successfully.',
            value: {
              type: Object,
              description: 'The saved document.'
            }
          }
        }
      }
    }
  },
  props: {
    collection: {
      type: String,
      description: 'The name of the collection to load the document from.',
      required: true
    },
    defaultData: {
      type: Object,
      description: 'The default document data. This is overriden with the loaded data.',
      default: () => ({})
    },
    documentId: {
      type: String,
      description: 'The id of the document',
      default: ''
    },
    noAutoload: {
      type: Boolean,
      description: [
        'By default, the document is loaded when this component is created. Set this to `false` cancel this action.',
        'To manually load the document, call the load() method.'
      ],
      default: false
    },
    removeUrl: {
      type: String,
      description: 'The url to remove the document.',
      default: ''
    },
    saveUrl: {
      type: String,
      description: 'The url to save the document.',
      default: ''
    }
  },
  data () {
    return {
      api: null,
      document: {},
      working: false
    }
  },
  watch: {
    working (value) {
      this.$emit('working', value)
    }
  },
  created () {
    this.$set(this, 'api', this.$dpd.col(this.collection))
    this.$set(this, 'document', this.defaultData)
    if (!this.noAutoload) {
      this.load()
    }
  },
  methods: {
    load (done = () => {}) {
      if (this.documentId) {
        this.working = true
        this.tryCatch(
          async () => {
            this.document = (await this.api.get(this.documentId)).data
            this.working = false
            this.$emit('loadOK', this.document)
          },
          error => {
            this.working = false
            this.$emit('loadError', error)
          }
        )
      }
    },
    refresh (done = () => {}) {
      this.document = {}
      this.load(done)
    },
    remove () {
      this.tryCatch(
        async () => {
          if (!this.documentId) {
            throw new Error('No id provided')
          }
          await (this.removeUrl ? this.$dpd.transport.delete(this.removeUrl) : this.api.del(this.documentId))
          this.$emit('removeOK', this.document)
        },
        error => {
          this.$emit('removeError', error)
          throw error
        }
      )
    },
    save (document) {
      this.working = true
      this.tryCatch(
        async () => {
          if (this.saveUrl) {
            const method = this.documentId ? 'put' : 'post'
            this.document = (await this.$dpd.transport[method](this.saveUrl, document || this.document)).data
          } else {
            if (this.documentId) {
              this.document = (await this.api.put(this.documentId, document || this.document)).data
            } else {
              this.document = (await this.api.post(document || this.document)).data
            }
          }
          this.$emit('saveOK', this.document)
          this.working = false
        },
        error => {
          this.$emit('saveError', error)
          this.working = false
        }
      )
    }
  }
}
</script>

<style>
</style>
