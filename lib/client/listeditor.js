ListEditor = {};

ListEditor.plugins = {
	mediumeditor: setDataOnMediumEditor,
	typeahead: setDataOnTypeahead,
	select2: setDataOnSelect2
};

// File Scope Global to store the current collection
var currentCollection = null;

/* Use this a wrapper to generate Iron Router options
		Additionally to normal Iron Router route options can include the following:
		{
			title: "Item",
			collection: function() { return MyCollection; }
		}

		The layoutTemplate is required and should contain the following:
		.new.button - Click event creates new item
		.remove.button - Click event removes current item
		.save.button - Click event saves current item
		.listEditorForm - Element that contains items
 */
ListEditor.route = function(opts) {
	var title = (opts.title) ? opts.title : "Item";

	var layoutTemplate = opts.layoutTemplate;
	_(Template[layoutTemplate]).extend({
		events: {
			'click .new.button': newItem,
			'click .remove.button': removeItem,
			'click .save.button': saveItem
		}
	});

	var plugins = opts.plugins || [];

	// Override any passed in options
	return _.extend({}, opts, {

		// Override the data method
		data: function() {
			// Set the collection
			currentCollection = opts.collection();

			// Use the data from the child data method, or null
			var routeData = (opts.data) ? opts.data.call(this) : null;
			var currentItemData = (routeData && routeData.data) ? routeData.data : null;

			// This is for widgets that don't like reactive data
			// It updates those widgets with the current item data
			_(plugins).each(function(plugin){
				plugin.call(this, currentItemData);
			}, this);

			/* Return the data combined with the title
					If called properly this will be in the form of:
					{
						title: 'title',
						data: {current data object},
						list: [list of data objects],
						_meta: {
							collection: {current collection object}
						}
					}
			 */
			return _.extend({},  routeData, {
				title: title,
				_meta: {
					collection: currentCollection
				}
			});

		},

		// Override the after action method to focus the first form element
		onAfterAction: function() {
			if (opts.onAfterAction)	opts.onAfterAction();
			focusForm();
		},

		// Override the run method
		onRun: function() {
			if (opts.onRun) opts.onRun();
		}

	});
};

function newItem() {
	// Reload the route with no data
	reloadRoute();
}

function removeItem(ev, tmpl) {
	// Get ID from dataset from route
	var id = this.data._id;
	if (id) {

		Dialog.ask('Delete item?',
		'Are you sure you want to delete this item?',
		function(approved){
			if (approved) {
				if (currentCollection) {
					currentCollection.remove(id);
					reloadRoute();
				}
			}
		}, this);

	}
}

function saveItem(ev, tmpl) {
	var dataToSave = tmpl.$('form').serializeJSON();
	if (!(dataToSave || currentCollection)) return;

	// Get ID from dataset from route
	var id = (this.data && this.data._id) ? this.data._id : null;
	dataToSave = _(dataToSave).omit('_id');

	if (id) {
		currentCollection.update(id, {$set: dataToSave});
		focusForm();
	} else {
		var newId = currentCollection.insert(dataToSave);
		reloadRoute({_id: newId});
	}
}

function focusForm() {
	window.setTimeout(function(){
		$('input', $('.listEditorForm')).focus();
	},250);
}

function reloadRoute(data) {
	var current = Router.current();
	if (current) {
		Router.go(current.route.name, data);
	}
}

function setDataOnMediumEditor(data) {
	$('.medium-editor').each(function(){
		var $this = $(this);
		var editor = $this.data('mediumeditor');
		if (editor) {
			var name = $this.attr('name');
			if (data && data[name]) {
				$this.html(data[name]);
			} else {
				$this.html('');
			}
		}
	});
}

function setDataOnTypeahead(data) {
	$('.tt-input').each(function(){
		var $this = $(this);
		var name = $this.attr('name');
		if (data && data[name]) {
			$this.typeahead('val', data[name]);
		} else {
			$this.typeahead('val', '');
		}
	});
}

function setDataOnSelect2(data) {
	$('input.select2').each(function() {
		var $this = $(this);
		var name = $this.attr('name');
		if (data && data[name]) {
			$this.select2('val', data[name]);
		} else {
			$this.select2('val', null);
		}
	});
}
