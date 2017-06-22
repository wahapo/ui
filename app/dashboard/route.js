import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    return { pipelines: this.store.findAll('pipeline') };
  }
});
