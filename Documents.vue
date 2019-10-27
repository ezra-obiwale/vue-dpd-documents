<template>
  <div>
    <slot :documents="documents" :working="working" />
  </div>
</template>

<script>
export default {
  name: 'DpdDocumentsComponent',
  docInfo: {
    description: 'Loads many documents.',
    slots: {
      default: {
        description: 'The default slot of the component.',
        scopedValues: {
          documents: {
            type: Array,
            description: 'The array of documents loaded.'
          },
          working: {
            type: Boolean,
            description: 'Indicates when the documents are being loaded.'
          }
        }
      }
    },
    methods: {
      clear: {
        description: 'Clears the loaded documents'
      },
      load: {
        description: 'Loads the documents, paginated or all.',
        params: [
          {
            type: Function,
            description: 'The function to call when the (paginated) documents have been loaded.'
          }
        ],
        events: {
          loadError: {
            description: 'Emitted when there is an error when loading the documents.',
            value: {
              type: Error,
              description: 'The error message received.'
            }
          },
          loadOK: {
            description: 'Emitted when the documents have been loaded.',
            value: {
              type: Array,
              description: 'An array of the loaded documents.'
            }
          }
        }
      },
      refresh: {
        description: 'A shortcut to call method clear() and then method load().'
      },
      remove: {
        description: 'Removes a document.',
        params: [
          {
            description: 'The id of the document to remove.'
          }
        ],
        events: {
          removeError: {
            description: 'Emitted when there is an error when removing a document.',
            value: {
              description: 'The id of the removed document.'
            }
          },
          removeOK: {
            description: 'Emitted when the document is removed successfully.',
            value: {
              type: Object,
              description: 'The object contains keys `id` and `error`.'
            }
          }
        }
      }
    },
  },
  props: {
    collection: {
      type: String,
      description: 'The name of the collection to load the documents from.',
      required: true
    },
    fetchAll: {
      type: Boolean,
      description: 'Indicates whether to fetch all or paginated documents.',
      default: false
    },
    limit: {
      type: [Number, String],
      description: 'The maximum number of documents to fetch in a paginated request.',
      default: 100
    },
    noAutoload: {
      type: Boolean,
      description: [
        'By default, documents are loaded when this component is created. Set this to `false` to cancel this behavior.',
        'To manually load documents, call the load() method.'
      ],
      default: false
    },
    query: {
      type: Object,
      description: 'The query to apply on the collection.',
      default: () => ({})
    },
    removeUrl: {
      type: String,
      description: 'The url to remove a document.',
      default: ''
    },
    loadUrl: {
      type: String,
      description: [
        'Provide the default url to use instead of the computed one.',
        'Note that you would have to handle pagination yourself'
      ],
      default: ''
    }
  },
  data () {
    return {
      api: null,
      documents: [],
      lastQuery: {},
      loadingMore: false,
      page: 1,
      working: false
    }
  },
  computed: {
    queryIsSame () {
      return JSON.stringify(this.requestQuery) === JSON.stringify(this.lastQuery)
    },
    requestQuery () {
      const defaultQuery = {}
      if (!this.fetchAll) {
        defaultQuery.$limit = this.limit
        defaultQuery.$skip = this.limit * (this.page - 1)
      }
      return {
        ...defaultQuery,
        ...this.query
      }
    }
  },
  watch: {
    loadUrl () {
      this.load()
    },
    noAutoload (value) {
      if (!value && !this.working && !this.documents.length) {
        this.load()
      }
    },
    query () {
      this.refresh()
    },
    working (value) {
      this.$emit('working', value)
    }
  },
  created () {
    this.$set(this, 'api', this.$dpd.col(this.collection))
    this.clear()
    if (!this.noAutoload) {
      this.load()
    }
  },
  methods: {
    clear () {
      this.documents = []
    },
    load (done = () => {}) {
      if (this.working) {
        return
      }
      if (this.fetchAll && this.documents.length) {
        return done([])
      }
      this.working = true
      this.tryCatch(
        async () => {
          let documents = []
          if (this.loadUrl) {
            documents = (await this.$dpd.transport.get(this.loadUrl)).data
          } else if (this.documents.length && this.queryIsSame) {
            this.working = false
            return done(this.documents)
          } else {
            documents = (await this.api.get(this.requestQuery)).data
            this.lastQuery = { ...this.requestQuery }
          }
          this.documents = [...this.documents, ...documents]
          this.page++
          this.working = false
          done(documents || [])
          this.$emit('loadOK', documents)
        },
        error => {
          done([])
          this.working = false
          this.$emit('loadError', error)
        }
      )
    },
    refresh (done = () => {}) {
      this.page = 1
      this.clear()
      this.load(done)
    },
    remove (id) {
      this.tryCatch(
        async () => {
          await (this.removeUrl ? this.$dpd.transport.delete(this.removeUrl) : this.api.del(id))
          const index = this.documents.findIndex(doc => doc.id === id)
          if (index > -1) {
            this.documents.splice(index, 1)
          }
          this.$emit('removeOK', id)
        },
        error => {
          this.$emit('removeError', { id, error })
          throw error
        }
      )
    }
  }
}
</script>

<style>
</style>
