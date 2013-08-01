/*
    LEANORAMA - jQuery Plugin for displaying and navigating panoramic images.
    Infobox Extension - dispalys information box on leanorama objects.

    Version 0.1.0
    -------------
    Copyright 2013 Leandigo (www.leandigo.com). All rights reserved.
    Use is subject to terms.
    
*/

$.fn.leanorama.extensions.push(function () {
    this.EV_INFOBOX_STARTED = 'leanoramaInfoboxStarted';
    
    // Create the infobox and add it to the main object
    this.create_infobox = function(data) {
        // Remove a previous, if exists
        $('.leanorama-infobox', this.$scope).remove();
        
        // The topmap object
        $boxbg = div({class: 'leanorama-infobox-bg'});
        $boxin = div({class: 'leanorama-infobox-inner'}).append(this.infobox);
        $box = div({class: 'leanorama-infobox'}).html('').append($boxbg, $boxin);

        // Animate the infobox addition to the page
        this.$el.after($box);
        $box.fadeIn('slow');
        
        this.$el.trigger(this.EV_INFOBOX_STARTED);
    };

    // Init the extension on startup
    var v = this.viewport();
    if (v.width > this.CON_VIEWPORT_WIDTH_LIMIT) {
        this.$el.bind(this.EV_ENGINE_STARTED, $.proxy(this.create_infobox, this));
    }
    
    // Helper functions
    // Create a DIV element
    function div(attrs) {
        return $(document.createElement('div')).attr(attrs);
    }
    // Create a SPAN element
    function span(attrs) {
        return $(document.createElement('span')).attr(attrs);
    }
});