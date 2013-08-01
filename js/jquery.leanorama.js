/*

LEANORAMA - jQuery Plugin for displaying and navigating panoramic images.
=========================================================================

Version 0.2.0

* Copyright 2013 Leandigo (www.leandigo.com). All rights reserved. *
* Use is subject to terms. *

.*/

(function($) {
    $.fn.leanorama = function(options) {
        
        var leanorama = {
            
            // This will refer to the jQuery object 
            $el                         : this,
            $scope                      : this.parent(),
            
            // EVENTS
            // Core Events
            EV_INIT                     : 'leanoramaInit',
            EV_RESIZE                   : 'leanoramaResize',
            EV_RESIZED                  : 'leanoramaResized',
                
            // Engine Events    
            EV_ENGINE_STARTED           : 'leanoramaEngineStarted',
            EV_ENGINE_STARTING          : 'leanoramaEngineStarting',
            EV_ENGINE_STOPPED           : 'leanoramaEngineStopped',
            EV_ENGINE_STOPPING          : 'leanoramaEngineStopping',
                
            // View Events  
            EV_VIEW_CHANGED             : 'leanoramaViewChanged',
            EV_VIEW_TRANSITION_STARTED  : 'leanoramaViewTransitionStarted',
            EV_VIEW_TRANSITION_STOPPED  : 'leanoramaViewTransitionStopped',
            
            // Autorotate Events    
            EV_AUTOROTATE_STARTED       : 'leanoramaAutorotateStarted',
            EV_AUTOROTATE_STOPPED       : 'leanoramaAutorotateStopped',

            // External Events
            EV_REFRESH                  : 'leanoramaRefresh',

            // Viewport Size Limitations
            CON_VIEWPORT_WIDTH_LIMIT    : 500,
            CON_VIEWPORT_HEIGHT_LIMIT   : 500,
            
            
            // INITIALIZATION VARIABLES
            limit                       : { top: 85, bottom: -85, right: 999, left: -999 }, // (object)     Field of vision limits
            lon                         : 0,                                                // (number)     Initial horizontal view angle
            lat                         : 0,                                                // (number)     Initial vertical view angle
            scale                       : 1,                                                // (number)     Initial scale (zoom factor)
            autorotate                  : 0,                                                // (number)     Initial autorotation speed
            gyrostab                    : 0,                                                // (integer)    Gyro stabilization factor
            fading                      : true,                                             // (boolean)    Enable fade in/out on start/stop
            autostart                   : true,                                             // (boolean)    Automatically start panorama
            mouse                       : true,                                             // (boolean)    Enable mouse bindings
            kbd                         : true,                                             // (boolean)    Enable keyboard bindings
            gyro                        : true,                                             // (boolean)    Enable gyro/accelerometer bindings
            touch                       : false,                                            // (boolean)    Enable touch bindings
            delay                       : 25,
            perspective                 : 645,

            // Internals
            dlan                        : 0,
            dlon                        : 0,
            dscale                      : 0,
            transitions                 : 0

        };
        $.extend(leanorama, options);

        (function() {
            // Private variables
            
            // Constants
            var SIDES       = ['front', 'left', 'back', 'right', 'top', 'bottom']   // Side names
            
            // Is viewer started?
            ,   started     = false
            // Viewer Elements
            ,   $el         = this.$el
            
            // Persistent variables for event and animation handling
            ,   delay       = 25                // Delay for animation interval
            ,   interval                        // Holds the animation interval
            ,   prev_lon                        // lon at previous animation cycle
            ,   prev_lat                        // lat at previous animation cycle
            ,   prev_scale                      // scale at previous animation cycle
            ,   dlon                            // difference between lon and its previous value
            ,   dlat                            // difference between lat and its previous value
            ;
            
            // To be called when a zoom(in/out) control is pressed
            // On each animation interval, scale will be multiplied by `val`
            this.scale_start = function(dscale) {
                this.transitions++;
                $el.trigger(this.EV_VIEW_TRANSITION_STARTED);
                this.dscale = dscale;
            };
            
            this.scale_stop = function() {
                this.dscale = 0;
                $el.trigger(this.EV_VIEW_TRANSITION_STOPPED);
            };
            
            this.scale_by = function(dscale) {
                this.scale += dscale;
            };
            
            // To be called when a pan(up/down/left/right) control is pressed
            // On each animation interval, lon and lat will be incremented
            // by the values of the respective arguments
            this.pan_start = function(dlon, dlat) {
                $el.trigger(this.EV_VIEW_TRANSITION_STARTED);
                this.dlon = dlon || this.dlon || 0;
                this.dlat = dlat || this.dlat || 0;
            };
            
            // To be called when a pan(up/down/left/right) control is released
            this.pan_stop = function(dir) {
                this.dlon = !dir || dir == "lon" ? 0 : this.dlon;
                this.dlat = !dir || dir == "lat" ? 0 : this.dlat;
                $el.trigger(this.EV_VIEW_TRANSITION_STOPPED);
            };
            
            this.pan_by = function(dlon, dlat) {
                this.lon += dlon;
                this.lat += dlat;
            };

            this.restart = function() {
                if (started) {
                    $el.bind(this.EV_ENGINE_STOPPED + '.restart', $.proxy(function() {
                        $el.unbind(this.EV_ENGINE_STOPPED + '.restart');
                        this.start();
                    }, this));
                    this.stop();
                } else {
                    this.start();
                }
            };

            this.refresh = function(e, data) {
                $.extend(this, data);
                this.restart();
            };

            this.stop = function() {
                if (!started) return;
                var defunct = this.$container;
                var do_stop = function() {
                    window.clearInterval(interval);
                    defunct.remove();
                    started = false;
                    this.$el.trigger(this.EV_ENGINE_STOPPED);
                };
                if (this.fading) {
                    defunct.animate({ opacity: 0 }, 2000, do_stop.call(this));
                } else {
                    do_stop.call(this);
                }
            };
            
            this.start = function() {
                if(started) return(this.restart());
                
                this.$sides = [];
                // Initialize cube sides
                for (i in SIDES)
                    this.$sides[i] = div({
                        class: 'leanorama-side leanorama-side-' + SIDES[i],
                        style: 'background-image : url("' + this.sides[i] + '");'
                    });
                
                // Construct inner HTML of viewer
                this.$cube = div({class: 'leanorama-cube'}).append(this.$sides);
                this.$surface = div({class: 'leanorama-surface'}).append(this.$cube);
                this.$container = $(document.createElement('section')).addClass('leanorama-container').append(this.$surface);
                $el.html(this.$container);
                this.fading && this.$container.css('opacity', 0);
                $el.addClass('leanorama-target');
                
                // Move everything to the center
                // perhaps should be done with CSS?
                this.$surface.css({
                    top : (this.$container.height() - this.$surface.height()) / 2 + 'px',
                    left: (this.$container.width() - this.$surface.width()) / 2 + 'px'
                });
                this.$cube.css({
                    top : this.$cube.height() / -4 + 'px',
                    left: this.$cube.width() / -4 + 'px'
                });
                
                // Reset latitude and turn autorotation on for next panorama
                this.lat = 0;
                //this.autorotate = 0.15;
                
                this.animate();
                
                this.fading && this.$container.animate({ opacity: 1 }, 2000);
                started = true;
                this.$el.trigger(this.EV_ENGINE_STARTED);
            };
            
            // Animation
            this.animate = function() {
                window.clearInterval(interval);
                interval = window.setInterval($.proxy(function() {

                    // Handle keyboard navigation
                    if (this.dlon || this.dlat) {
                        this.autorotate && this.toggle_rotate();
                        this.lon += this.dlon;
                        this.lat += this.dlat;
                    }
                    
                    // Zoom - if necessary
                    this.scale += this.dscale;
                    
                    // Handle automatic rotation
                    this.lon += this.autorotate;
                    
                    // Make sure we stay within limits vertically
                    if (this.lat > this.limit.top || this.lat < this.limit.bottom) this.lat = prev_lat;
                    
                    // Horizontal limits are more difficult - we enforce the limits only
                    // if the direction of the movement is opposite to the side of the boundary.
                    // Also, if autodirection is on, its direction is inverted
                    if ((this.lon >= this.limit.right && this.lon > prev_lon && prev_lon <= this.limit.right) ||
                        (this.lon <= this.limit.left  && this.lon < prev_lon && prev_lon >= this.limit.left)) {
                        this.lon = prev_lon;
                        this.autorotate = -this.autorotate;
                    }
                    
                    // Enforce the zoom limits
                    if (this.scale < 1) this.scale = 1;
                    if (this.scale > 8) this.scale = 8;
                    
                    // For convenience, angles are kept within the "-180 < lon < 180" range
                    this.lon = degnormalize(this.lon);
                    
                    // Perform the actual animation
                    this.update_view();
                    
                    // If projection has actually moved, fire the event to tell the world
                    if (!(prev_lon == this.lon && prev_lat == this.lat && prev_scale == this.scale)) {                    
                        
                        // Save the previous values
                        dlon = this.lon - prev_lon;
                        dlat = this.lat - prev_lat;
                        prev_lon = this.lon;
                        prev_lat = this.lat;
                        prev_scale = this.scale;
                        
                        $el.trigger(this.EV_VIEW_CHANGED);
                    }
                }, this), this.delay);
            };
            
            this.update_view = function() {
                this.$container.transition({ scale: this.scale }, 0);
                this.$surface.transition({ z: this.perspective, rotateX: this.lat, rotateY: this.lon }, 0);
            };
            
            // Toggle autorotate
            this.toggle_rotate = function() {
                if (this.autorotate) {
                    this.autorotate = 0;
                    $el.trigger(this.EV_AUTOROTATE_STOPPED);
                } else {
                    this.autorotate = 0.1;
                    $el.trigger(this.EV_AUTOROTATE_STARTED);
                }
            };
            
            this.viewport = function() {
                var viewPortWidth;
                var viewPortHeight;
                
                // the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
                if (typeof window.innerWidth != 'undefined') {
                    viewPortWidth = window.innerWidth,
                    viewPortHeight = window.innerHeight;
                }
                
                // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
                else if (typeof document.documentElement != 'undefined'
                && typeof document.documentElement.clientWidth !=
                'undefined' && document.documentElement.clientWidth !== 0) {
                    viewPortWidth = document.documentElement.clientWidth,
                    viewPortHeight = document.documentElement.clientHeight;
                }
                
                // older versions of IE
                else {
                    viewPortWidth = document.getElementsByTagName('body')[0].clientWidth,
                    viewPortHeight = document.getElementsByTagName('body')[0].clientHeight;
                }
                
                return {'width': viewPortWidth, 'height': viewPortHeight};
            };
            
            for (e in $.fn.leanorama.extensions) { $.fn.leanorama.extensions[e].call(this); }        
            this.autostart && this.start();
            $el.trigger(this.EV_INIT);
            $el.on(this.EV_REFRESH, $.proxy(this.refresh, this));

        }).call(leanorama);
        return this;
    };
    
    var ext_ctrl = function() {
        var $el = this.$el;
        $.extend(this, {
            EV_CONTROLS_BIND_ALL        : 'leanoramaControlsBindAll',
            EV_CONTROLS_UNBIND_ALL      : 'leanoramaControlsUnbindAll',
        });
        
        this.bind_functions     = [];
        this.unbind_functions   = [];
        this.bind_all           = function() {
            for (f in this.bind_functions) {
                this[f] && this.bind_functions[f].call(this);
            }
        };
        this.unbind_all         = function() {
            for (f in this.unbind_functions) {
                this[f] && this.unbind_functions[f].call(this);
            }
        };

        $el.bind(this.EV_ENGINE_STARTED, $.proxy(this.bind_all,   this));
        $el.bind(this.EV_ENGINE_STOPPED, $.proxy(this.unbind_all, this));
    };
    
    var ext_ctrl_mouse = function() {
        var $el = this.$el;
        $.extend(this, {
            EV_CONTROLS_MOUSE_ON        : 'leanoramaControlsMouseOn',
            EV_CONTROLS_MOUSE_OFF       : 'leanoramaControlsMouseOff'
        });
        
        // mousewheel - Zoom in and out.
        function mousewheel(e) {
            e.preventDefault();
            this.scale *= e.originalEvent.wheelDeltaY > 0 ? 1.1 : 0.9;
            e.stopPropagation();
        }
        
        // mousedown - When mouse key is pressed
        function mousedown(e) {
            e.preventDefault();
            
            // Initialize mouse position
            var x0, y0;
            this.$container.bind('mousemove', $.proxy(function(e) {
                // Get muose coordinates at the movement
                x0 = x0 || e.screenX;
                y0 = y0 || e.screenY;
                
                // If as movement progresses, update lon and lat
                this.lon -= (e.screenX - x0) * 0.1;
                this.lat += (e.screenY - y0) * 0.1;
                
                // Save coordinates for movement continuation
                x0 = e.screenX;
                y0 = e.screenY;
            }, this));
            
            // Stop autorotate
            this.autorotate && this.toggle_rotate();
            e.stopPropagation();
        }
        
        // mouseup - When mouse key is released
        function mouseup(e) {
            e.preventDefault();
            this.$container.unbind('mousemove');
            e.stopPropagation();
        }

        // Bind all mouse events
        this.bind_mouse = function() {
            $el.bind('mousewheel', $.proxy(mousewheel, this));
            $el.bind('mousedown',  $.proxy(mousedown, this));
            $el.bind('mouseup',    $.proxy(mouseup, this));
            $el.trigger(this.EV_CONTROLS_MOUSE_ON);
        };
        
        // Unbind mouse events
        this.unbind_mouse = function() {
            $el.unbind('mousewheel');
            $el.unbind('mousedown');
            $el.unbind('mouseup');
            $el.trigger(this.EV_CONTROLS_MOUSE_OFF);
        };
        
        this.bind_functions.mouse     = this.bind_mouse;
        this.unbind_functions.mouse   = this.unbind_mouse;
    };
    
    var ext_ctrl_kbd = function() {
        var $el = this.$el;
        $.extend(this, {
            EV_CONTROLS_KEYBOARD_ON     : 'leanoramaControlsKeyboardOn',
            EV_CONTROLS_KEYBOARD_OFF    : 'leanoramaControlsKeyboardOff',
        });
        
        // keydown - When key is pressed
        function keydown(e) {
            var which = e.originalEvent.which;
            // Arrows
            if      (which == 37)  this.pan_start(-2, 0);
            else if (which == 38)  this.pan_start(0,  2);
            else if (which == 39)  this.pan_start(2,  0);
            else if (which == 40)  this.pan_start(0, -2);
            
            // = for zoom in, - for zoom out
            else if (which == 187) this.scale_start(0.1);
            else if (which == 189) this.scale_start(-0.1);
            
            // Space bar for toggle rotation
            else if (which == 32)  this.toggle_rotate();
        }
        
        // keyup - When key is released
        function keyup(e) {
            var which = e.originalEvent.which;
            if (which == 38  || which == 40)  this.pan_stop('lat');
            if (which == 37  || which == 39)  this.pan_stop('lon');
            if (which == 187 || which == 189) this.scale_stop();
        }
        
        // Bind all keyboard events
        this.bind_kbd = function() {
            $(window).bind('keydown.leanorama', $.proxy(keydown, this));
            $(window).bind('keyup.leanorama',   $.proxy(keyup,   this));
            $el.trigger(this.EV_CONTROLS_KEYBOARD_ON);
        };
        
        // Unbind keyboard events
        this.unbind_kbd = function() {
            $(window).unbind('keyup.leanorama');
            $(window).unbind('keydown.leanorama');
            $el.trigger(this.EV_CONTROLS_KEYBOARD_OFF);
        };
        
        this.bind_functions.kbd    = this.bind_kbd;
        this.unbind_functions.kbd  = this.unbind_kbd;
    };
    
    var ext_ctrl_touch = function() {
        var $el     = this.$el    
        // Touch stuff
        ,   t0x0            // X-coordinate of touch input 0, when touch started
        ,   t0y0            // Y-coordinate of touch input 0, when touch started
        ,   t1x0            // X-coordinate of touch input 1, when touch started
        ,   t1y0            // Y-coordinate of touch input 1, when touch started
        ,   estack  = []
        ;
        
        // touchstart
        function touchstart(e) {
            $el.trigger(this.EV_VIEW_TRANSITION_STARTED);
            e.preventDefault();
            t0x0 = e.originalEvent.touches[0].screenX;
            t0y0 = e.originalEvent.touches[0].screenY;
            if (e.originalEvent.touches[1]) {
                t1x0 = e.originalEvent.touches[1].screenX;
                t1y0 = e.originalEvent.touches[1].screenY;
            }
            e.stopPropagation();
        }
        
        function touchmove(e) {
            e.preventDefault();
            var t0x = e.originalEvent.touches[0].screenX
            ,   t0y = e.originalEvent.touches[0].screenY;
            if (e.originalEvent.touches[1]) {
                var t1x = e.originalEvent.touches[1].screenX
                ,   t1y = e.originalEvent.touches[1].screenY;
                t1x0 = t1x0 || e.originalEvent.touches[1].screenX;
                t1y0 = t1y0 || e.originalEvent.touches[1].screenY;
                var dis = Math.sqrt(Math.pow(Math.abs(t1x - t0x), 2) + Math.pow(Math.abs(t1y - t0y), 2));
                var dis0 = Math.sqrt(Math.pow(Math.abs(t1x0 - t0x0), 2) + Math.pow(Math.abs(t1y0 - t0y0), 2));
                this.scale_by(dis / dis0 - 1|| 0);
                t1x0 = t1x;
                t1y0 = t1y;
            }
            else {
                dx = (t0x - t0x0) || 0;
                dy = (t0y - t0y0) || 0;
                this.pan_by(-dx * 0.2, dy * 0.2);
//                if (dx) el.lon -= dx * 0.2;
//                if (dy) el.lat += dy * 0.2;
//                alpha0 -= dx * 0.2;
//                gamma0 += dy * 0.2;
            }
            t0x0 = t0x;
            t0y0 = t0y;
            e.stopPropagation();
            this.autorotate && this.toggle_rotate();
            return false;
        }
        
        function touchend(e) {
            e.preventDefault();
            this.pan_stop();
            t0x0 = undefined;
            t0y0 = undefined;
            t1x0 = undefined;
            t1y0 = undefined;
            return false;
        }
        
        // Bind all touch events
        this.bind_touch = function() {
            $el.bind('touchstart.leanorama', $.proxy(touchstart, this));
            $el.bind('touchmove.leanorama',  $.proxy(touchmove, this));
            $el.bind('touchend.leanorama',   $.proxy(touchend, this));
        };
        
        // Unbind all touch events
        this.unbind_touch = function() {
            $el.bind('touchstart.leanorama');
            $el.bind('touchmove.leanorama');
            $el.bind('touchend.leanorama');
        };
        
        this.bind_functions.touch   = this.bind_touch;
        this.unbind_functions.touch = this.unbind_touch;
    };
    
    // Register the basic Leanorama extensions
    $.fn.leanorama.extensions = [ext_ctrl, ext_ctrl_mouse, ext_ctrl_kbd, ext_ctrl_touch];
    
    // Add gyro if supported
    if (window.DeviceOrientationEvent) {

        // Gyro control extension
        var ext_ctrl_gyro = function() {
            var $el     = this.$el
    
            // Gyro stuff
            ,   gyro        = true              // Indicates whether gyro is active    
            ,   alpha0      = 0                 // Initial alpha (horizontal device rotation)
            ,   gamma0      = 0                 // Initial gamma (vertical device tilt)
            ,   was_gyro    = false             // Indicates whether gyro control should be restored
            ,   alphas      = []                // Used for horizontal stabilization
            ,   gammas      = []                // Used for vertical stabilization
            ,   moving      = false             // Indicates whether already in a middle of gyro event
            ;
            
            $.extend(this, {
                EV_CONTROLS_GYRO_ON     : 'leanoramaControlsGyroOn',
                EV_CONTROLS_GYRO_OFF    : 'leanoramaControlsGyroOff',
            });
            
            // deviceorientation - Gyro support
            function deviceorientation(e) {
                
                if (this.autorotate) return;
                // Make sure we're done processing previous events
                if (moving) return;
                moving = true;
    
                e.preventDefault();
                var ev = e.originalEvent;
                
                // Make sure gyro is actually reports something
                if (!(ev.alpha || ev.beta || ev.gamma)) {
                    this.gyro = false;
                    this.unbind_gyro();
                    return;
                }
                
                // If this is the first time the event fires, remember initial values
                if (!alpha0) {
                    alpha0 = alpha0 || ev.alpha;
                    gamma0 = gamma0 || 0;   
                }
    
                var alpha = 0, gamma = 0;
                
                // Calculating the average of the last `gyrostab` locations... hack hack hack
                for (i=1; i<alphas.length; i++) {
                    if (Math.abs(alphas[alphas.length - 1] - ev.alpha) < 100) alphas[i-1] = alphas[i] || ev.alpha;
                    else alphas[i-1] = ev.alpha;
                    if (Math.abs(gammas[gammas.length - 1] - ev.gamma) < 100) gammas[i-1] = gammas[i] || 0;
                    else gammas[i-1] = ev.gamma;
                    alpha += alphas[i-1];
                    gamma += gammas[i-1];
                }
                
                // ... hack hack hack ...
                alphas[alphas.length ? alphas.length - 1 : 0] = ev.alpha;
                gammas[gammas.length ? gammas.length - 1 : 0] = ev.gamma;
                alpha = (alpha + alphas[alphas.length - 1]) / alphas.length;
                gamma = (gamma + gammas[gammas.length - 1]) / gammas.length;
    
                // Making sure we don't encounter weird angles
                if (gamma >= -180 && gamma <=  180) this.lat = Math.abs(gamma) - 90 + gamma0;
                if (gamma >   180 || gamma <  -180) this.lat = 270 - Math.abs(gamma) + gamma0;
                
                // Move
                this.lon = degnormalize(alpha0 - alpha + 90);
                moving = false;
            }
    
            this.bind_gyro = function() {
                if (this.autorotate) return;
                this.gyro = true;
                alpha0 = undefined;
                gamma0 = undefined;
                $(window).bind('deviceorientation.leanorama', $.proxy(deviceorientation, this));
                $el.trigger(this.EV_CONTROLS_GYRO_ON);
                $el.bind(this.EV_VIEW_TRANSITION_STARTED, $.proxy(this.suspend_gyro, this));
            };
    
            this.unbind_gyro = function() {
                if (!this.gyro) return;
                $(window).unbind('deviceorientation.leanorama');
                this.gyro = false;
                $el.trigger(this.EV_CONTROLS_GYRO_OFF);
                $el.unbind(this.EV_VIEW_TRANSITION_STARTED);
                $el.unbind(this.EV_VIEW_TRANSITION_STOPPED);
            };
            
            this.suspend_gyro = function() {
                //was_gyro = this.gyro;
                this.unbind_gyro();
                $el.bind(this.EV_VIEW_TRANSITION_STOPPED, $.proxy(this.restore_gyro, this));
            };
            
            this.restore_gyro = function() {
                //was_gyro && 
                this.bind_gyro();
            };
            
                
            this.bind_functions.gyro   = this.bind_gyro;
            this.unbind_functions.gyro = this.unbind_gyro; 
        };
    
        // Register Gyro to the Leanorama extensions
        $.fn.leanorama.extensions.push(ext_ctrl_gyro);

    }

    // Helper functions
    function div(attrs) {
        return $(document.createElement('div')).attr(attrs);
    }
    
    function degnormalize(deg) {
        while (deg > 180)  deg -= 360;
        while (deg < -180) deg += 360;
        return deg;
    }

})(jQuery);