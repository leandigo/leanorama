/*
    LEANORAMA - jQuery Plugin for displaying and navigating panoramic images.
    Hotspot Extension - displays hotspots on leanorama objects.

    Version 0.2.0
    -------------
    Copyright 2013 Leandigo (www.leandigo.com). All rights reserved.
    Use is subject to terms.
    
*/

$.fn.leanorama.extensions.push(function() {
    this.EV_HOTSPOT_CLICK       = 'leanoramaHotspotClick';
    
    // This holds all the hotspots, their handles and their data
    var $hotspots   = []
    ;    
    
    // Create a hotspot on panorama's surface
    function create_hotspot(data) {
        // Hotspot's geometry and type - corresponds with the model
        var geometry    = data.geometry || 'dot'
        ,   type        = data.type || 'nav'
        
        // The index for the hotspot inside the hotspot array
        ,   ix          = $hotspots.length
        
        // Create the hotspot and the handle
        ,   $hotspot    = div({class: 'leanorama-hotspot leanorama-hotspot-' + geometry, id: data.id})
        ,   $handle     = div({class: 'leanorama-hotspot-handle'})
        ,   $handle_inner = div({class: 'leanorama-hotspot-handle-' + type, id: data.id + '_handle'})
        ;
        
        var title;
        
        switch (type) {
            // Handle the navigational hotspots
            case 'nav':
                title = data.name || 'Go to';
                
                $handle_inner.attr('rel', 'tooltip')
                             .attr('data-html', true)
                             .attr('data-original-title', title);
                             
                break;
            // Handle the informational hotspots
            case 'info':
                var closebtn = '<span class="btn btn-mini btn-danger" style="float: right;" onclick="$(\'#' + data.id + '_handle\').popover(\'hide\');">x</span>';
                title = '<b>' + (data.name || 'Information') + '</b>' + closebtn;
                var content = data.value || data.name || 'N/A';
                
                $handle_inner.attr('rel', 'popover')
                             .attr('data-html', true)
                             .attr('data-original-title', title)
                             .attr('data-content', content);
                break;

            // Handle the link hotspots
            case 'link':
                title = data.name || 'Link';

                $handle_inner.attr('rel', 'tooltip')
                             .attr('data-html', true)
                             .attr('data-original-title', title)
                             .click(function() { window.open(data.value, '_blank'); });
                break;

            // Handle the actionable hotspots
            case 'action':
                title = data.name || 'Turn On/Off';

                $handle_inner.attr('rel', 'tooltip')
                             .attr('trigger', 'manual')
                             .attr('data-placement', 'bottom')
                             .attr('data-html', true)
                             .attr('data-original-title', title);
                break;
        }
        
        // Append the hotspot to the face it belongs, and place it where it should be
        this.$sides[data.face].append($hotspot);
        $hotspot.css({top: data.y, left: data.x});
        
        // Construct hotspot layer on the panorama
        this.$el.append($handle.append($handle_inner));
        
        // Init the relevant Bootstrap objects for the hotspots
        $('.leanorama-hotspot-handle-info').popover();
        $('.leanorama-hotspot-handle-nav').tooltip();
        $('.leanorama-hotspot-handle-link').tooltip();
    
        $handle.bind('touchend click', $.proxy(function() {
            // TODO: For touch event - check that on touchend the finger is still
            //       on the hotspot, otherwise don't trigger the event.
            this.$el.trigger(this.EV_HOTSPOT_CLICK, [data]);
        }, this));
        
        // Add hotspot to the hotspot array
        $hotspots[ix] = { hotspot: $hotspot, data: data, handle: $handle };
        
        // Fugly fugly hack hack hack!!!
        this.lon += 0.01;
    }
    
    // When leanorama's view is changed, we'll be moving the hotspots' handles
    this.$el.bind(this.EV_VIEW_CHANGED, $.proxy(function() {
        for (var ix in $hotspots) {
            // Set variables for current hotspot
            var $hotspot    = $hotspots[ix].hotspot
            ,   $handle     = $hotspots[ix].handle
            ,   data        = $hotspots[ix].data
            
            // Angles corresponding to faces [0, 1, 2, 3]
            ,   lon_face    = [90, 180, -90, 0]
            
            // Calculation of the angle at which the hotspot should be visible head on
            ,   w           = this.$sides[data.face].width() / 2
            ,   angle       = degnormalize(lon_face[data.face] + Math.atan((data.x - w) / w) * 180 / Math.PI)
            ;
            
            // Poorman's frustum culling
            // We're checking if it's possible that the hotspot is inside the FOV.
            // If it is, we're moving it to its location. Otherwise, we'll hiding it.
            if ((data.face <= 3 && inrange(angle-90, angle+90, this.lon))
            ||  (data.face == 4 && this.lat > 0)
            ||  (data.face == 5 && this.lat < 0)) {
                
                // This is where the hotspot is supposed to be on the screen
                var rect        = $hotspot[0].getBoundingClientRect()
                
                // This are the boundaries of the panorama viewer
                ,   frect       = this.$el[0].getBoundingClientRect()
                
                // This is where the handle should be shown
                ,   offset      = { top : this.$el.offset().top  - frect.top  + rect.top,
                                    left: this.$el.offset().left - frect.left + rect.left }
                ;
                
                // Make it visible, and appear wherever we need it
                $handle.css('opacity', 1);
                $handle.offset(offset);
            } else {
                
                // Go away!
                $handle.css('opacity', 0);
            }
        }
    }, this));
    
    this.$el.bind(this.EV_ENGINE_STOPPED, function() {
        $('.leanorama-hotspot-handle').animate({ opacity: this.fading ? 0 : 1 }, this.fading ? 2000 : 0);
    });
    
    // Create the hotspots
    this.$el.bind(this.EV_ENGINE_STARTED, $.proxy(function() {
        for (i in this.hotspots) {
            create_hotspot.call(this, this.hotspots[i]);
        }
    }, this));
    
    // Helper functions
    // Create a DIV element
    function div(attrs) {
        return $(document.createElement('div')).attr(attrs);
    }
    // Create a SPAN element
    function span(attrs) {
        return $(document.createElement('span')).attr(attrs);
    }
    
    // Normalize angles => -180 <= deg <= 180
    function degnormalize(deg) {
        while (deg > 180)  deg -= 360;
        while (deg < -180) deg += 360;
        return deg;
    }
    
    // Check whether an angle is in range between limitl and limitr
    function inrange(limitl, limitr, angle) {
        limitr += limitr > limitl || 360;
        return ((limitl < angle && limitr > angle) ||
                (limitl - 360 < angle && limitr - 360 > angle) ||
                (limitl + 360 < angle && limitr + 360 > angle));
    }
});