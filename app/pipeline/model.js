import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
  admins: DS.attr(),
  appId: Ember.computed.alias('scmRepo.name'),
  branch: Ember.computed.alias('scmRepo.branch'),
  checkoutUrl: DS.attr('string'),
  createTime: DS.attr('date'),
  events: DS.hasMany('event', { async: true }),
  hubUrl: Ember.computed.alias('scmRepo.url'),
  jobs: DS.hasMany('job', { async: true }),
  scmRepo: DS.attr(),
  scmUri: DS.attr('string'),
  secrets: DS.hasMany('secret', { async: true }),
  standardJobs: Ember.computed.filter('jobs', j => !/^PR-/.test(j.get('name'))),
  pullRequests: Ember.computed.filter('jobs', j => /^PR-/.test(j.get('name'))),
  failingPRs: Ember.computed.filter('pullRequests',
    j => j.get('lastBuild.status') && j.get('lastBuild.status') !== 'SUCCESS'
  )
});
