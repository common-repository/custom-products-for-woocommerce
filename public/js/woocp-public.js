// noinspection JSUnresolvedVariable
(function( $ ) {
    'use strict';
    //let aniTime = 500;	//slow
    //let aniTime2 = 250;	//fast
    let aniTime3 = 150;	//faster
    // let aniTime4 = 75;	//super fast
    let selectH = 55;

    let activeCustomizer = false;

    $.widget( 'custom.iconselectmenu', $.ui.selectmenu, {
        _renderItem: function( ul, item ) {
            let li = $( '<li>' ),
                wrapper = $( '<div>', { text: item.label } );

            if ( item.disabled ) {
                li.addClass( 'ui-state-disabled' );
            }

            $( '<span>', {
                style: item.element.attr( 'data-style' ),
                'class': 'ui-icon ' + item.element.attr( 'data-class' )
            })
                .appendTo( wrapper );

            return li.append( wrapper ).appendTo( ul );
        }
    });
    $.fn.woocpChangeProduct = function() {
        let cEl = $(this);
        let container = $('.woocp_customizer_container');
        let customizer = container.find('.woocp_customizer');
        container.woocpDoOverlay();
        let prodId = cEl.val();
        let data = {
            'action': 'woocp_change_product',
            'product_id': prodId
        };
        // noinspection JSUnresolvedVariable
        $.post(ajax_object.ajax_url, data, function(response) {
            customizer.css('height',customizer.height()).attr('data-productid',prodId).children().each(function(){
                $(this).fadeOut(aniTime3,function(){
                    $(this).remove();
                    if($(this).hasClass('woocp_product_customizer_image')){
                        customizer.append(response).css('height','auto');
                        if(container.find('image#canvas_bg').length > 0){
                            container.find('image#canvas_bg').on('load',function(){
                                container.woocpUndoOverlay();
                            });
                        }
                        else if(container.find('img#woocp_customizer_image').length > 0){
                            container.find('img#woocp_customizer_image').on('load',function(){
                                container.woocpUndoOverlay();
                            });
                        }
                        $( '.woocp_attribute_select,.woocp_product_select' ).each(function(){
                            $(this).iconselectmenu().iconselectmenu( 'menuWidget' ).addClass( 'ui-menu-icons woocp_option_icons' );
                        });
                        //IE fix
                        setTimeout(function(){
                            container.woocpUndoOverlay();
                        },500);
                    }
                });
            });

        });
    };

    $.fn.woocpAddToCart = function(prodId=false) {
        let atcEl = $(this);
        if(!prodId) prodId = $(this).attr('data-productid');
        let selectedEl = atcEl.closest('form').find('input[name="woocp_selected"]');
        if(selectedEl.length < 1){
            selectedEl = atcEl.closest('.woocp_add_to_cart_container').find('input[name="woocp_selected"]');
        }
        if(selectedEl.length < 1){
            selectedEl = $('input[name=\'woocp_selected\']');
        }
        if(selectedEl.length < 1){
            return;
        }
        let selected = selectedEl.val();
        let quantity = atcEl.closest('form').find('input[name="quantity"].woocp_quantity').val();
        if(null == quantity || undefined === typeof quantity || 'undefined' === quantity) {
            quantity = $('.quantity input').val();
        }
        let target = $(this).closest('.woocp_add_to_cart_container').find('.woocp_msg_area');
        let spinner = $(this).closest('.woocp_add_to_cart_container').find('.woocp_spinner_container');

        $(atcEl).attr('disabled','true');
        spinner.show();
        target.height(0);

        let data = {
            'action': 'woocp_add_to_cart',
            'woocp_selected': selected,
            'add_to_cart': prodId,
            'qty': quantity
        };

        // noinspection JSUnresolvedVariable
        $.post(ajax_object.ajax_url, data, function(response) {
            spinner.hide();
            target.html(response);
            let h = target.find('[class^="woocommerce-"]')[0].offsetHeight;
            target.height(h);
            $(atcEl).removeAttr('disabled');
        });
    };
    $.fn.woocpDoOverlay = function(){
        $(this).addClass("processing").block({
            message: null ,
            overlayCSS: {
                background: "rgba(255,255,255,0.6)",
                opacity: 1,
                zIndex: 999999999
            }
        });
    };
    $.fn.woocpUndoOverlay = function(){
        $(this).removeClass("processing").unblock();
    };
    $.fn.woocpFindClosestTarget = function(){
        let button = $(this);
        let target = false;
        let atcContainer = button.closest('[data-currenttargetclass]');

        // woocp button
        if(atcContainer.length > 0){
            let targetAttr = atcContainer.attr('data-currenttargetclass');
            if(typeof targetAttr != "undefined") {
                let customizer = $('[data-targetclass="'+targetAttr+'"]');
                if(customizer.length > 0) activeCustomizer = customizer;
                return atcContainer;
            }
        }

        // default button
        $('.woocp_customizer').each(function(){
            let customizer = $(this);
            let targetC = $(this).closest('[data-targetclass]').attr('data-targetclass');
            if(typeof targetC != "undefined"){
                let targetEl = button.closest('.'+targetC);
                if(typeof targetEl != "undefined"){
                    target = targetEl;
                    activeCustomizer = customizer;
                    return target;
                }
            }
            else target = customizer;
        });
        return target;
    };
    $.fn.woocpCheckRequiredComponents = function(){
        let result = true;
        let val = $(this).find('input[name="woocp_selected"]').val();
        if(typeof val != "undefined"){
            let obj = JSON.parse(val);
            if(activeCustomizer === false && $(this).hasClass('woocp_customizer')) {
                activeCustomizer = $(this);
            }
            if(activeCustomizer !== false){
                let requiredComponents = [];
                // gather all required components
                activeCustomizer.find('.woocp_product_component').each(function () {
                    let comp = $(this);
                    let requiredS = comp.attr('data-required');
                    if (requiredS === 'true') requiredComponents.push(comp.attr('data-componentid'));
                });
                if(requiredComponents.length < 1) return true;

                Object.keys(obj).forEach(function (key) {
                    let current = obj[key];
                    if(requiredComponents.includes(current.id)){
                        if(current.attrs.length < 1) {
                            result = false;
                        }
                    }
                });
                // if we have required components, but nothing at all was selected
                if(Object.entries(obj).length < 1 && obj.constructor === Object && requiredComponents.length > 0) {
                    result = false;
                }
                // set error classes for non valid components
                requiredComponents.forEach(function(compId){
                    let comp = $('.woocp_product_component[data-componentid="'+compId+'"]');
                    let compValid = true;
                    let atLeastOneSelected = false;
                    let attrs = comp.find('.woocp_component_attribute');
                    let i = 1;
                    attrs.each(function(){
                        let attr = $(this);
                        if(parseInt(attr.find('select').val()) > 0) {
                            atLeastOneSelected = true;
                        }

                        if(parseInt(attr.find('select').val()) < 1) {
                            // if attr is required OR we reached the end and no attr was selected
                            if(attr.attr('data-required') === "true" || i === attrs.size() && !atLeastOneSelected){
                                compValid = false;
                            }
                            if(attr.attr('data-required') === "true"){
                                attr.addClass('woocp_required_attribute_error');
                            }
                        }
                        i++;
                    });
                    if(compValid) comp.removeClass('woocp_required_component_error');
                    else comp.addClass('woocp_required_component_error');

                });
            }
        }
        return result;
    };
    // noinspection JSUnusedLocalSymbols
    $.fn.clearRequiredAttribute = function(e){
        let attrSelect = $(this);
        if(attrSelect.val() > 0) attrSelect.closest('.woocp_component_attribute').removeClass('woocp_required_attribute_error');
        let target = $(this).woocpFindClosestTarget();
        target.woocpCheckRequiredComponents();
    }
    // noinspection JSUnusedLocalSymbols
    $.fn.woocpComponentCheck = function(e){
        let result = true;
        let target = $(this).woocpFindClosestTarget();

        $('.woocp_msg_area').each(function(){
            if($(this).find('.required-components').length > 0){
                $(this).html('').height(0);
            }
        });
        if (target !== false) {
            let check = target.woocpCheckRequiredComponents();
            if(!check){
                //show message & reset
                let msgC = target.find('.woocp_msg_area');
                if(msgC.length > 1){
                    msgC = $(msgC[0]);
                }
                if(msgC.length > 0){
                    target.showRequiredComponentsMessage();
                }
                result = false;
                return result;
            }
        }
        return result;
    };
    $.fn.showRequiredComponentsMessage = function(){
        let target = $(this);
        let msgArea1 = target.find('.woocp_msg_area');
        if(msgArea1.length > 1){
            msgArea1 = $(msgArea1[0]);
        }
        let msgArea2 = activeCustomizer.find('.woocp_msg_area');
        if(msgArea2.length > 1){
            msgArea2 = $(msgArea2[0]);
        }
        // noinspection JSUnresolvedVariable
        let msg = ajax_object.requiredComponentsMessage;
        if(msgArea1.length > 0){
            msgArea1.html('<div class="woocommerce-error required-components">'+msg+'</div>').height('auto');
        }
        else if(msgArea2.length > 0){
            msgArea2.html('<div class="woocommerce-error required-components">'+msg+'</div>').height('auto');
        }
    };

    $(document).on('ready ajaxComplete',function(){
        woocpAddMissingForms();
    });
    $(document).on('ready',function(){
        $( '.woocp_attribute_select,.woocp_product_select' ).each(function(){
            $(this).iconselectmenu().iconselectmenu( 'menuWidget' ).addClass( 'ui-menu-icons woocp_option_icons' );
        });
        $('.woocp_customizer_container .ui-selectmenu-button').each(function(){
            let w = $(this).closest('.woocp_customizer_container').find('.woocp_customizer').width();
            $(this).width(w);
        });
    });
    $(document).on('click','.woocp_product_component.collapsed .expand',function(e){
        e.preventDefault();
        let target = $(this).closest('.woocp_product_component');
        target.removeClass('collapsed').addClass('expanded');
        target.find('.woocp_component_attribute').each(function(){
            $(this).animate({height:selectH},aniTime3).removeClass('collapsed').addClass('expanded');
        });
    });
    $(document).on('click','.woocp_product_component.expanded .expand',function(e){
        e.preventDefault();
        let target = $(this).closest('.woocp_product_component');
        target.removeClass('expanded').addClass('collapsed');
        target.find('.woocp_component_attribute').each(function(){
            $(this).animate({height:0},aniTime3).removeClass('expanded').addClass('collapsed');
        });
    });

    $(document).on('click','.woocp_add_to_cart_button',function(e){
        e.preventDefault();
        let requiredCCheck = $(this).woocpComponentCheck(e);
        if(requiredCCheck) $(this).woocpAddToCart();
    });
    $(document).on('click','.single_add_to_cart_button:not(.woocp_add_to_cart_button)',function(e){
        let requiredCCheck = $(this).woocpComponentCheck(e);
        if(!requiredCCheck) e.preventDefault();
    });

    $(document).on('iconselectmenuchange','.woocp_attribute_select',function(e){
        e.preventDefault();
        let targetClass = $(this).closest('.woocp_customizer_container-components_list').attr('data-targetClass');
        woocpUpdateSelectedArray($(this).closest('.woocp_customizer'), targetClass);
        $(this).iconselectmenu('close');
        $(this).clearRequiredAttribute();
    });
    $(document).on('iconselectmenuchange','.woocp_product_select', function(e){
        e.stopPropagation();
        $(this).woocpChangeProduct();
        $(this).iconselectmenu('close');
    });

    function woocpUpdateSelectedArray(customizer=false, targetClass=false){
        if(false === customizer){
            customizer = $('.woocp_customizer');
        }
        let target = customizer.find('input[name="woocp_selected"]');
        if(false !== targetClass && 'undefined' !== targetClass && undefined !== typeof targetClass && undefined !== targetClass && targetClass.length > 0) {
            target = $('.'+targetClass).find('input[name="woocp_selected"]');
        }
        let selected = {};
        let compObj = {};
        let val, attrId, attrLabel, compId, compLabel, fee, optLabel;
        customizer.find('.woocp_product_component').each(function(){
            let coEl = $(this);
            compId = coEl.attr('data-componentid');
            compLabel = coEl.attr('data-componentlabel');
            fee = null;
            compObj = {'id': compId,'label': compLabel,'fee': fee,'attrs': []};
            selected[compId] = compObj;
            coEl.find('.woocp_component_attribute').each(function(){
                val = $(this).find('select').val();
                if(parseInt(val) !== 0){
                    optLabel = $(this).find('select option[value="'+val+'"]').attr('data-label');
                    attrId = $(this).attr('data-attributeid');
                    attrLabel = $(this).attr('data-attributelabel');
                    selected[compId]['attrs'].push({'id':attrId,'label':attrLabel,'selected':val,'selectedLabel':optLabel});
                }
            });
        });
        target.each(function(){
            $(this).val(JSON.stringify(selected));
        });
    }

    function woocpAddMissingForms() {
        $('input[name="woocp_selected"]').each(function(){
            let el = $(this);
            if(el.closest('form').length === 0 && el.closest('div.cart').length > 0){
                let form = el.closest('div.cart');
                let formHtml = form.html();
                let prodId = form.attr('data-product_id');
                let variations = form.attr('data-product_variations');
                let enctype = form.attr('enctype');
                let method = form.attr('method');
                let action = form.attr('action');
                let classes = form.attr('class');

                let newEl = $('<form class="'+classes+'" enctype="'+enctype+'" method="'+method+'" action="'+action+'" data-product_id="'+prodId+'" data-product_variations=\''+variations+'\'></form>');
                newEl.html(formHtml);

                form.replaceWith(newEl);
            }
        });
    }

})( jQuery );