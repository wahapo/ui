import Ember from 'ember';

export default Ember.Controller.extend({
  pipelineSortKey: ['appId'],
  sortedPipelines: Ember.computed.sort('model.pipelines.[]', 'pipelineSortKey')
});
