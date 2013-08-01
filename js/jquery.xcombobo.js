(function($) {
    $.fn.slydown = function(options) {
        var $el = this;
        function init() {
            var $selected = div({class: options.classSelected || 'slydown-selected', value: options.selected})
                            .append(options.choices[options.selected] || '')
            ,   $choices  = div({class: options.classChoices || 'slydown-choices', style: options.choicesVisible ? '' : 'display: none;'})
                            .html(options.text || 'Select a different view')
            ;
            
            options.fn = options.fn || function() {};
            
            $selected.click(function() { $choices.slideToggle(); });
            
            $el.html('').append([$selected, $choices]);
            for (c in options.choices) {
                if (c == options.selected) continue;
                var $choice = div({class: options.classItem || 'slydown-item', value: c}).append(options.choices[c]);
                $choices.append($choice);
                $choice.click($.proxy(function($c) {
                    options.selected = $c.attr('value');
                    //$selected.replaceWith($c.clone());
                    //$c.hide();
                    $choices.slideUp();
                    options.fn($c.attr('value'));
                }, this, $choice));
            }
        }
        
        init();
        return this;
    };
    
    function div(attrs) {
        return $(document.createElement('div')).attr(attrs);
    }
    
})(jQuery);