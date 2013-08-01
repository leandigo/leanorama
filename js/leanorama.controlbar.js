/*
    LEANORAMA - jQuery Plugin for displaying and navigating panoramic images.
    Control Bar Extension - dispalys navigations control bar for leanorama objects.

    Version 0.2.0
    -------------
    Copyright 2013 Leandigo (www.leandigo.com). All rights reserved.
    Use is subject to terms.
    
*/

$.fn.leanorama.extensions.push(function start() {
    // Create the bar and control elements
    var $bar, $controls;
    
    // Create the topmap and add it to the main object
    function create_controlbar() {
        // Remove a previous instance of the control bar if it exists
        $('.leanorama-controlbar', this.$scope).remove();
        
        // Create the controls objects
        $controls = {
            show:       div({class: 'leanorama-controlbar-button'}).html('v')   // Show bar
                        .css('display', 'none')
                        .css('margin-left', '.5em'),
            hide:       div({class: 'leanorama-controlbar-button actionable'}).html('h'),  // Hide bar
            delim:      div({class: 'leanorama-controlbar-button'}).html('|'),  // Buttons delimiter
            zoomin:     div({class: 'leanorama-controlbar-button actionable'}).html('+'),  // Zoom in
            zoomout:    div({class: 'leanorama-controlbar-button actionable'}).html('-'),  // Zoom out
            play:       div({class: 'leanorama-controlbar-button actionable'}).html('p'),  // Start autorotate
            stop:       div({class: 'leanorama-controlbar-button actionable'}).html('s'),  // Stop autorotate
            up:         div({class: 'leanorama-controlbar-button actionable'}).html('u'),  // Look up
            down:       div({class: 'leanorama-controlbar-button actionable'}).html('d'),  // Look down
            left:       div({class: 'leanorama-controlbar-button actionable'}).html('l'),  // Look left
            right:      div({class: 'leanorama-controlbar-button actionable'}).html('r'),  // Look right
            touch:      div({class: 'leanorama-controlbar-button actionable'}).html('t'),  // Touch control (turns Gyro off)
            gyro:       div({class: 'leanorama-controlbar-button actionable'}).html('g')   // Gyro control (turns Touch off)
        };
        
        // Check if thE autorotate is on. Yes, show Stop button, otherwise the Play button
        if (this.autorotate === 0 ) {
            $controls.stop.css('display', 'none');
        } else {
            $controls.play.css('display', 'none');
        }
        
        // Create controls cotnainer and add all control buttons
        var $container = div({class: 'leanorama-controlbar-controls'})
                     .append($controls.hide)
                     .append($controls.delim);


        // Check for device orientation support to enable gyro control
        var canHandleOrientation;
        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", handleOrientation, false);
        }

        function handleOrientation(event){
          canHandleOrientation = event; // will be either null or with event data
        }

        // Add gyro/touch controls, if supported
        if (canHandleOrientation) {
          $container.append($controls.touch)
                      .append($controls.gyro);
            if (this.gyro) {
                $controls.gyro.css('display', 'none');
            } else {
                $controls.touch.css('display', 'none');
            }
        }
        
        $container.append($controls.zoomin)
                  .append($controls.zoomout)
                  .append($controls.left)
                  .append($controls.right)
                  .append($controls.up)
                  .append($controls.down)
                  .append($controls.play)
                  .append($controls.stop)
                  .append($controls.show);
        
        // Create the control bar element
        $bar = div({class: 'leanorama-controlbar'});
        // Background layer should be sibling of the controls so that the opacity won't cascade to the buttons
        $bar.append(div({class: 'leanorama-controlbar-bg'}));
        $bar.append($container);
        
        // Animate the control bar addition to the page
        $bar.css('display', 'none');
        this.$el.after($bar);
        $bar.fadeIn('slow');
        
        /* Control bar events bindings */
        
        // Bind the "hide control bar" button
        $controls.hide.click($.proxy(function() {
            this.toggle_controlbar();
        }, this));
        
        // Bind the "show control bar" button
        $controls.show.click($.proxy(function() {
            this.toggle_controlbar();
        }, this));
        
        // Bind the Start Autorotate button
        $controls.play.click($.proxy(function() {
            show_stop();
            this.toggle_rotate();
        }, this));
        
        // Bind the Stop Autorotate button
        $controls.stop.click($.proxy(function() {
            show_play();
            this.toggle_rotate();
        }, this));
        
        // Override the keydown binding of Leanorama for Spacebar to include the control bar Play/Stop button toggle
        $(window).bind('keydown', $.proxy(function(e) {
            if (e.originalEvent.which == 32) {
                this.toggle_rotate();
                if (this.autorotate === 0 ) $controls.play.click();
                else $controls.stop.click();
            }
        }, this));
        
        // Bind the Gyro button
        $controls.gyro.click($.proxy(function() {
            // Switch to Gyro control
            this.unbind_touch();
            this.bind_gyro();
            
            // Remove the Gyro button and show the Touch button
            $controls.gyro.hide();
            $controls.touch.fadeIn('fast');
        }, this));
        
        // Bind the Touch button
        $controls.touch.click($.proxy(function() {
            // Switch to Touch control
            this.unbind_gyro();
            this.bind_touch();
            
            // Remove the Touch button and show the Gyro button
            $controls.touch.hide();
            $controls.gyro.fadeIn('fast');
        }, this));
      
        // Bind the Zoom In button
        $controls.zoomin.bind('touchstart mousedown', $.proxy(function() {
            this.scale_start(0.05);
        }, this)).bind('touchend mouseup',$.proxy(function() {
            this.scale_stop();
        }, this));
        
        // Bind the Zoom Out button
        $controls.zoomout.bind('touchstart mousedown', $.proxy(function() {
            this.scale_start(-0.05);
        }, this)).bind('touchend mouseup', $.proxy(function() {
            this.scale_stop();
        }, this));
        
        // Bind the Left button
        $controls.left.bind('touchstart mousedown', $.proxy(function() {
            this.pan_start(-0.7, 0);
            show_play();
        }, this)).bind('touchend mouseup', $.proxy(function() {
            this.pan_stop();
        }, this));
        
        // Bind the Right button
        $controls.right.bind('touchstart mousedown', $.proxy(function() {
            this.pan_start(0.7, 0);
            show_play();
        }, this)).bind('touchend mouseup', $.proxy(function() {
            this.pan_stop();
        }, this));
        
        // Bind the Up button
        $controls.up.bind('touchstart mousedown', $.proxy(function() {
            this.pan_start(0, 0.7);
            show_play();
        }, this)).bind('touchend mouseup', $.proxy(function() {
            this.pan_stop();
        }, this));
        
        // Bind the Down button
        $controls.down.bind('touchstart mousedown', $.proxy(function() {
            this.pan_start(0, -0.7);
            show_play();
        }, this)).bind('touchend mouseup', $.proxy(function() {
            this.pan_stop();
        }, this));
    }
    
    // Toggle show/hide controls bar
    this.toggle_controlbar = $.proxy(function() {
        // Make sure the control bar exists
        if ($bar.exists()) {
            $bar.css('left') == '0px'? $controls.show.fadeIn('fast') : $controls.show.fadeOut('fast');
            
            // Hide / Show the control bar
            $bar.animate({
                left: $bar.css('left') == '0px'? '-' + ($bar.width()-$bar.height()) : '0'
            });
        }
    }, this);
    
    // Remove the topmap object
    function remove_controlbar() {
        if ($bar.exists()) {
            // In case the map is already shown (When changing viewpoint for example)
            $bar.fadeOut('slow');
            setTimeout(function() {
                $bar.remove();
            }, 600);
        }
    }
    
    function show_play() {
        $controls.stop.hide();
        $controls.play.show();
    }
    
    function show_stop() {
        $controls.play.hide();
        $controls.stop.show();
    }

    // Respond to the change state event
    this.$el.bind(this.EV_AUTOROTATE_STOPPED, show_play);
    this.$el.bind(this.EV_AUTOROTATE_STARTED, show_stop);

    // Init the extension on startup
    this.$el.bind(this.EV_ENGINE_STARTED, $.proxy(create_controlbar, this));

    // Helper functions
    // Create a DIV element
    function div(attrs) {
        return $(document.createElement('div')).attr(attrs);
    }
    // Create a SPAN element
    function span(attrs) {
        return $(document.createElement('span')).attr(attrs);
    }
    
    $.fn.exists = function() {
        return this.length > 0;
    };
});