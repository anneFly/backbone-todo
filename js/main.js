(function (window, document, Backbone, $) {
	"use strict";    
    
    window.App = {};
    
	// Models:

	var SingleItem = Backbone.Model.extend({
		defaults: {
			title: 'no title entered',
			description: 'no description text entered',
			done: false
		},
		initialize: function () {
			var title = this.get('title');
			console.log('item has been created. The title is: ' + title);
		}
	});

	// Collections:

	var AllItems = Backbone.Collection.extend({
		model: SingleItem,
		initialize: function () {
			this.on('add', function (item) {
				console.log('item added to collection');
			});
			this.on('remove', function (item) {
				console.log('item removed from collection');
			});
			this.on('save:list', function () {
				var newTodo = new SingleItem({title: 'add save functionality', description: 'figure out how to store the list on a server and oad it again'});
				this.push(newTodo);
			});
		}
	});

	App.myItems = new AllItems();
	

	// Views:

	var SingleItemView = Backbone.View.extend({
		className: 'item',
		events: {
			'click': 'doSomething'
		},
		doSomething: function () {
			this.$el.find('p').slideToggle();
		},
		deleteItem: function (m) {
			App.myItems.remove(m);
		},
		markAsDone: function () {
			var done = this.model.get('done');
			if (done) {
				this.$el.find('h1').css('text-decoration', 'line-through');
				this.$el.find('.do-btn').text('undo');
			} else {
				this.$el.find('h1').css('text-decoration', 'none');
				this.$el.find('.do-btn').text('done');
			}
		},
		toggleDone: function () {
			var st = this.model.get('done') ? false : true;
			this.model.set('done', st);
			console.log(st);
			this.updateView(this.model);
		},
		updateView: function (m) {
			if (m.hasChanged(['done'])) {
				this.markAsDone();
			}
		},
		initialize: function () {
			var self = this,
				$h1 = $('<h1>' + this.model.get('title') + '</h1>'),
				$p = $('<p style="display: none">' + this.model.get('description') + '</p>'),
				$done = $('<button class="do-btn"></button>'),
				$del = $('<button>delete</button>');
			$del.on('click', function(e) {
				self.deleteItem(self.model);
				e.stopPropagation();
			});
			$done.on('click', function(e) {
				self.toggleDone();
				e.stopPropagation();
			});
				
			$h1.append($done).append($del);
			this.$el.append($h1).append($p);
			
			self.model.on('change', this.updateView, this);
			
			self.markAsDone();
		}
	});

	var CollectionView = Backbone.View.extend({
		id: 'my-collection',
		childViews: [],
		addItem: function (m) {
			var view = new SingleItemView({model: m});
			this.$el.append(view.$el);
			view.render();
			this.childViews.push(view);
		},
		removeItem: function (m) {
			this.childViews.forEach(function (v) {
				if (v.model === m) {
					v.remove();
				}
			})
		},
		initialize: function () {
			var self = this;
			this.collection.each(function (m) {
				var view = new SingleItemView({model: m});
				self.$el.append(view.$el);
				view.render();
				self.childViews.push(view);
			});
			this.collection.bind('add', this.addItem, this);
			this.collection.bind('remove', this.removeItem, this);
			this.render();
		}
	});

	var InputView = Backbone.View.extend({
		tagName: 'input',
		initialize: function () {
			this.$el.attr({type: 'text', placeholder: this.model.get('placeholder')});
			this.$el.val(this.model.get('value'));
			this.render();
		},
		render: function () {
	
		}
	});

	var ButtonView = Backbone.View.extend({
		tagName: 'button',
		events: {
			'click': 'action'
		},
		initialize: function () {
			if (this.model.get('type')) {
				this.$el.attr('type', this.model.get('type'));
			}
			
			this.render();
		},
		action: function (e) {
			var fn = this.model.get('action');
			if (fn && this[fn]) {
				this[fn].call(this, e);
			} else {
				return false;
			}
		},
		submitForm: function () {
			console.log('form submit');
		},
		saveList: function () {
			App.myItems.trigger('save:list');
		},
		render:function () {
			this.$el.text(this.model.get('text'));
		}
	});
	
	var FormView = Backbone.View.extend({
		tagName: 'form',
		events: {
			'submit': 'submit'
		},
		submit: function (e) {
			var fn = this.model.get('submitAction');
			if (fn && this[fn]) {
				this[fn].call(this, e);
			} else {
				return false;
			}
		},
		prevent: function (e) {
			e.preventDefault();
		}
	});

	var RecordFormView = FormView.extend({
		childViews: [],
		initialize: function () {
			var myTitleInput = new InputView({model: new Backbone.Model({placeholder: 'title', value: ''})}),
				myDescInput = new InputView({model: new Backbone.Model({placeholder: 'description', value: ''})}),
				mySubmitButton = new ButtonView({model: new Backbone.Model({action: 'submitForm', type: 'submit', text: 'create record'})});
			this.childViews.push(myTitleInput, myDescInput);
			this.$el.append(myTitleInput.$el).append(myDescInput.$el).append(mySubmitButton.$el);
			this.$el.attr('action', '#');
			this.render();
		},
		m: {},
		createRecord: function (e) {
			var self = this;
			_.defaults(self.m, {title: 'no title entered', description: 'no description text entered'});
			this.childViews.forEach(function (v) {
				if (v.$el.val() !== '') {
					self.m[v.model.get('placeholder')] = v.$el.val();
				}
			});
			App.myItems.add(new SingleItem(this.m));
			this.childViews.forEach(function (v) {
				v.$el.val('');
			});
			this.m = {};
			e.preventDefault();
		}
	});


	App.myFormView = new RecordFormView({model: new Backbone.Model({submitAction: 'createRecord', title: '', description: ''})});

	App.mySaveButtonView = new ButtonView({model: new Backbone.Model({action: 'saveList', text: 'save'})});

	App.myCollectionView = new CollectionView({collection: App.myItems});
	$('body').append(App.myCollectionView.$el).append(App.myFormView.$el).append(App.mySaveButtonView.$el);


}(this, this.document, Backbone, jQuery));