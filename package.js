Package.describe({
  summary: 'Addon to Iron Router that provides a simple data editor with list of items'
});

Package.on_use(function (api) {
	api.use('underscore', 'client');
	api.use('jquery', 'client');
	api.use('semantic-ui-less', 'client');
	api.use('iron-router', 'client');

  	api.add_files('lib/client/listeditor.js', 'client');

	api.export('ListEditor', 'client');
});
