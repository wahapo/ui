import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';
import wait from 'ember-test-helpers/wait';
import injectSessionStub from '../../../helpers/inject-session';

const mockCollection = {
  id: 1,
  name: 'Test',
  description: 'Test description',
  get: name => name
};

const collectionModel = {
  save() {
    return new Ember.RSVP.Promise(resolve => resolve(mockCollection));
  },
  destroyRecord() {}
};

moduleForComponent('collections-flyout', 'Integration | Component | collections flyout', {
  integration: true
});

test('it renders', function (assert) {
  assert.expect(5);
  const $ = this.$;

  injectSessionStub(this);

  this.set('collections', [
    Ember.Object.create({
      id: 1,
      name: 'collection1',
      description: 'description1',
      pipelineIds: [1, 2, 3]
    }),
    Ember.Object.create({
      id: 2,
      name: 'collection2',
      description: 'description2',
      pipelineIds: [4, 5, 6]
    }),
    Ember.Object.create({
      id: 3,
      name: 'collection3',
      description: 'description3',
      pipelineIds: [7, 8, 9]
    })
  ]);

  this.render(hbs`{{collections-flyout collections=collections}}`);

  assert.equal($('.header__text').text().trim(), 'Collections');
  assert.equal($('.header__text a i').attr('class'), 'fa fa-plus-circle fa-mdx ember-view');
  assert.equal($($('.collection-wrapper a').get(0)).text().trim(), 'collection1');
  assert.equal($($('.collection-wrapper a').get(1)).text().trim(), 'collection2');
  assert.equal($($('.collection-wrapper a').get(2)).text().trim(), 'collection3');
});

test('it renders with no collections', function (assert) {
  assert.expect(2);
  const $ = this.$;
  const noCollectionsText = 'No collections to display.';

  this.set('collections', []);

  this.render(hbs`{{collections-flyout collections=collections}}`);

  assert.equal($('.no-collections-text').length, 1);
  assert.equal($('.no-collections-text').text().trim(), noCollectionsText);
});

test('it opens collection create modal', function (assert) {
  assert.expect(9);
  const $ = this.$;

  injectSessionStub(this);

  this.set('collections', []);
  this.set('showModal', false);

  this.render(hbs`{{collections-flyout collections=collections showModal=showModal}}`);
  assert.equal(this.get('showModal'), false);
  // Make sure there are no modals
  assert.notOk($('.modal').length);

  $('.new').click();

  return wait().then(() => {
    const modalTitle = 'Create a new Collection';
    const cancelButton = $('.collection-form__cancel');
    const createButton = $('.collection-form__create');

    assert.equal(this.get('showModal'), true);
    // Make sure there is only 1 modal
    assert.equal($('.modal').length, 1);
    assert.equal($('.modal-title').text().trim(), modalTitle);
    assert.equal($('.name input').length, 1);
    assert.equal($('.description input').length, 1);
    assert.equal(cancelButton.text().trim(), 'Cancel');
    assert.equal(createButton.text().trim(), 'Create');
  });
});

test('it creates a collection', function (assert) {
  assert.expect(4);

  injectSessionStub(this);

  const $ = this.$;
  const storeStub = Ember.Object.extend({
    createRecord(model, data) {
      assert.strictEqual(model, 'collection');
      assert.deepEqual(data, {
        name: 'Test',
        description: 'Test description'
      });

      return collectionModel;
    },
    findAll() {
      return new Ember.RSVP.Promise(resolve => resolve([mockCollection]));
    }
  });

  this.set('collections', []);
  this.set('showModal', false);
  this.set('name', null);
  this.set('description', null);

  this.register('service:store', storeStub);
  this.inject.service('store');

  this.render(hbs`{{collections-flyout
    collections=collections
    showModal=showModal
    name=name
    description=description
  }}`);

  $('.new').click();

  this.set('name', 'Test');
  this.set('description', 'Test description');

  assert.ok(this.get('showModal'));

  $('.collection-form__create').click();

  assert.notOk(this.get('showModal'));
});

test('it renders an active collection', function (assert) {
  assert.expect(4);
  const $ = this.$;

  const storeStub = Ember.Object.extend({
    findAll() {
      return new Ember.RSVP.Promise(resolve => resolve([mockCollection]));
    }
  });

  this.register('service:store', storeStub);
  this.inject.service('store');

  this.set('selectedCollectionId', 1);

  this.render(hbs`{{collections-flyout selectedCollectionId=selectedCollectionId}}`);

  assert.equal($('.header__text').text().trim(), 'Collections');
  assert.notOk($('.header__text a i').length);
  assert.equal($($('.collection-wrapper a').get(0)).text().trim(), 'name');
  assert.equal($('.collection-wrapper.row--active').length, 1);
});

test('it fails to create a collection', function (assert) {
  assert.expect(3);

  injectSessionStub(this);

  const $ = this.$;
  const model = {
    save() {
      return new Ember.RSVP.Promise((resolve, reject) => reject({
        errors: [{
          detail: 'This is an error message'
        }]
      }));
    },
    destroyRecord() {}
  };
  const storeStub = Ember.Object.extend({
    createRecord() {
      return model;
    }
  });

  this.set('collections', []);
  this.set('showModal', false);
  this.set('errorMessage', null);
  this.set('name', null);
  this.set('description', null);

  this.register('service:store', storeStub);
  this.inject.service('store');

  this.render(hbs`{{collections-flyout
    collections=collections
    showModal=showModal
    name=name
    description=description
  }}`);

  $('.new').click();

  this.set('name', 'Test');
  this.set('description', 'Test description');

  assert.ok(this.get('showModal'));
  $('.collection-form__create').click();
  // Modal should remain open because of error
  assert.ok(this.get('showModal'));
  assert.strictEqual($('.alert-warning > span').text().trim(),
    'This is an error message');
});

test('it cancels creation of a collection', function (assert) {
  const $ = this.$;

  injectSessionStub(this);

  this.set('collections', []);
  this.set('showModal', false);

  this.render(hbs`{{collections-flyout collections=collections showModal=showModal}}`);

  $('.new').click();
  assert.ok(this.get('showModal'));
  $('.collection-form__cancel').click();
  assert.notOk(this.get('showModal'));
});

test('it deletes a collection', function (assert) {
  assert.expect(7);

  injectSessionStub(this);

  const $ = this.$;
  const collectionModelMock = {
    destroyRecord() {
      // Dummy assert to make sure this function gets called
      assert.ok(true);

      return new Ember.RSVP.Promise(resolve => resolve());
    }
  };
  const storeStub = Ember.Object.extend({
    findRecord() {
      return new Ember.RSVP.Promise(resolve => resolve(collectionModelMock));
    },
    findAll() {
      return new Ember.RSVP.Promise(resolve => resolve([mockCollection]));
    }
  });

  this.set('collections', [
    Ember.Object.create({
      id: 1,
      name: 'collection1',
      description: 'description1',
      pipelineIds: [1, 2, 3]
    }),
    Ember.Object.create({
      id: 2,
      name: 'collection2',
      description: 'description2',
      pipelineIds: [4, 5, 6]
    }),
    Ember.Object.create({
      id: 3,
      name: 'collection3',
      description: 'description3',
      pipelineIds: [7, 8, 9]
    })
  ]);
  this.set('showModal', false);
  this.set('name', null);
  this.set('description', null);

  this.register('service:store', storeStub);
  this.inject.service('store');

  this.render(hbs`{{collections-flyout
    collections=collections
    showModal=showModal
    name=name
    description=description
  }}`);

  assert.ok($('.header__edit').length);
  // Make sure delete buttons aren't shown
  assert.notOk($('.collection-wrapper__delete').length);
  $('.header__edit').click();
  // Delete buttons should be visible
  assert.strictEqual($('.collection-wrapper__delete').length, 3);
  assert.notOk($('.modal').length);
  $($('.collection-wrapper__delete').get(0)).click();
  assert.strictEqual($('.modal').length, 1);
  assert.equal($('.modal-title').text().trim(), 'Please confirm');
  $('.modal-footer> .btn-primary').click();
});
