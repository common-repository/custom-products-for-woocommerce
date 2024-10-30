// noinspection JSUnresolvedVariable
(function( $ ) {
    'use strict';
    //let aniTime = 500;	//slow
    let aniTime2 = 250;	//fast
    //let aniTime3 = 150;	//faster
    //let aniTime4 = 75;	//super fast

    $.fn.woocpAddProductComponent = function() {
        //get attached components and add the new id
        let success = true;
        let select = $('#_woocp_product_components_select');
        if(select.val() === 'placeholder') return false;

        let compId = parseInt(select.val());
        let attached = $('input[name="_woocp_product_components"]');
        let attachedArray = JSON.parse(attached.val());
        if(attachedArray == null) attachedArray = [];

        attachedArray.forEach(function(comp){
            if(parseInt(comp.id) === compId) success = false;
        });
        if(!success) return false;
        $('.spinner.woocp_add_component').css('visibility','visible');

        let postId = $('input[name="post_ID"]').val();
        let newObj = {'id':compId,'label':'','description':'','fee':'','attrs':[]};
        attachedArray.push(newObj);
        let newArray = JSON.stringify(attachedArray);

        //add new array to hidden input field
        $(attached).val(newArray);

        let data = {
            'action': 'woocp_add_product_component',
            'postId': postId,
            'componentId': compId,
            '_woocp_product_components': newArray
        };

        // noinspection JSUnresolvedVariable
        jQuery.post(ajaxurl, data, function(response) {
            $('#woocp_product_components_list').append(response);
            $('.spinner.woocp_add_component').css('visibility','hidden');
            woocpResetTipTip();
        });
    };

    $.fn.woocpSaveProductComponents = function() {
        let fullArray = woocpGetFullArray();
        let postId = $('input[name="post_ID"]').val();
        let custFee = '';

        let data = {
            'action': 'woocp_save_product_components',
            'postId': postId,
            '_woocp_product_components': fullArray,
            'woocp_product_customization_fee':custFee
        };

        // noinspection JSUnusedLocalSymbols,JSUnresolvedVariable
        jQuery.post(ajaxurl, data, function(response) {
            $('.woocp_message .msg1').fadeOut(aniTime2);
            $('.spinner.woocp_save_components').css('visibility','hidden');
        });
    };

    $.fn.woocpDeleteProductComponent = function() {
        let confirm = window.confirm('Are you sure you want to remove this component?');
        if(confirm){
            let id = $(this).closest('.woocp_product_component').attr('data-componentId');
            let attachedEl = $('input[name="_woocp_product_components"]');
            let attached = JSON.parse(attachedEl.val());
            for(let i=0;i<attached.length;i++){
                if(parseInt(attached[i].id) === parseInt(id)) attached.splice(i,1);
            }
            if(!attached) attached = [];
            $(this).closest('.woocp_product_component').remove();
            $(attachedEl).val(JSON.stringify(attached));
            $(attachedEl).woocpSaveProductComponents();
        }
    };

    $.fn.woocpAddComponentAttribute = function() {
        let acaEl = $(this);
        woocpGetFullArray();
        //if selected is placeholder return false
        let select = $(acaEl).closest('.woocp_product_component').find('.woocp_attributes_select');
        if(select.val() === 'placeholder') return false;

        let newVal = parseInt(select.val());
        let componentId = $(acaEl).closest('.woocp_product_component').attr('data-componentId');
        //if selected exists in full array return false
        let attached = $('input[name="woocp_component_attributes_'+componentId+'"]');
        let attachedArray = JSON.parse(attached.val());
        if(attachedArray == null) attachedArray = {};
        if(newVal in attachedArray) return false;

        $(this).closest('.woocp_add_attribute_field').find('.spinner.woocp_add_attribute').css('visibility','visible');

        $('input[name^="woocp_component_attributes_"]').each(function(){
            let caId = $(this).attr('name').replace('woocp_component_attributes_','');
            let attachedAttr = JSON.parse($(this).val());

            //attach new attribute to component attributes object
            if(caId === componentId && !attachedAttr.includes(newVal)){
                let newValObj = {"id":newVal,"options": []};
                attachedAttr.push(newValObj);
                $('input[name^="woocp_component_attributes_'+componentId+'"]').val(JSON.stringify(attachedAttr));
            }

        });
        let data = {
            'action': 'woocp_add_component_attribute',
            'attributeId': newVal,
        };

        // noinspection JSUnresolvedVariable
        jQuery.post(ajaxurl, data, function(response) {
            $(document).woocpSaveProductComponents();
            $(acaEl).closest('.woocp_product_component').find('.woocp_component_attributes_list').append(response);
            $('.woocp_select2').select2();
            woocpResetTipTip();
            $('.spinner.woocp_add_attribute').css('visibility','hidden');
        });
    };

    $.fn.woocpDeleteComponentAttribute= function() {
        let confirm = window.confirm('Are you sure you want to remove this attribute?');
        if(confirm){
            let cId = $(this).closest('.woocp_product_component').attr('data-componentId');
            let id = $(this).closest('.woocp_options_select_container').attr('data-attributeId');
            let attachedEl = $('input[name="woocp_component_attributes_'+cId+'"]');

            let attached = JSON.parse(attachedEl.val());
            for(let i=0;i<attached.length;i++){
                if(parseInt(attached[i].id) === parseInt(id)) attached.splice(i,1);
            }
            if(!attached) attached = [];

            $(this).closest('.woocp_options_select_container').remove();
            $(attachedEl).val(JSON.stringify(attached));
            $(attachedEl).woocpSaveProductComponents();
        }
    };

    $.fn.woocpUpdateAttributeOption = function() {
        let options = $(this).val();
        let cId = $(this).closest('.woocp_product_component').attr('data-componentId');
        let attr = $(this).closest('.woocp_options_select_container');
        let aId = attr.attr('data-attributeId');
        let target = $('input[name^="woocp_component_attributes_'+cId+'"]');
        let targetAr = JSON.parse(target.val());
        if(options !== null){
            $.each(targetAr,function(ind,val){
                if(parseInt(val.id) === parseInt(aId)) {
                    val.options = options;
                }
            });
        }
        target.val(JSON.stringify(targetAr));
        woocpGetFullArray();
    };

    $.fn.woocpSortComponents = function() {
        let sortEl = $(this);
        let startIndex = sortEl.attr('data-startindex');
        let newIndex = sortEl.index();
        let compId = sortEl.attr('data-componentid');
        if(startIndex === newIndex) return false;
        //update array and show message
        let sorted = $( '#woocp_product_components_list' ).sortable( 'toArray', {attribute:'data-componentid'});
        for(let i=0;i<sorted.length;i++) sorted[i] = parseInt(sorted[i]);
        $('input[name="_woocp_product_components_order"]').val(JSON.stringify(sorted));
        $('.woocp_message .msg1').fadeIn(aniTime2);
        //update tag list with new order
        let tag = $('#woocp_product_customizer_tag_list .woocp_component_tag[data-componentid="'+compId+'"');
        if(newIndex > startIndex) {
            let prevId = sortEl[0].previousElementSibling.attributes['data-componentid']['value'];
            tag.insertAfter($('#woocp_product_customizer_tag_list .woocp_component_tag[data-componentid="'+prevId+'"'));
        }
        if(newIndex < startIndex) {
            let prevId = sortEl[0].nextElementSibling.attributes['data-componentid']['value'];
            tag.insertBefore($('#woocp_product_customizer_tag_list .woocp_component_tag[data-componentid="'+prevId+'"'), tag);
        }
    };

    $.fn.woocpAttrSortable = function() {
        let target = $(this).find('.woocp_component_attributes_list');
        target.sortable({
            opacity: 0.6,
            cursor: 'move',
            handle: '.sorthandle',
            placeholder: "ui-state-highlight"
        });
    };

    $.fn.woocpSortAttributes = function() {
        let compId = $(this).closest('.woocp_product_component').attr('data-componentid');
        let sorted = $('.woocp_product_component[data-componentid="'+compId+'"] .woocp_component_attributes_list').sortable( 'toArray', {attribute:'data-attributeid'});
        let inputEl = $('input[name="woocp_component_attributes_'+compId+'"]');
        let curOrder = JSON.parse(inputEl.val());
        $('.woocp_message .msg1').fadeIn(aniTime2);
        let newAr = [];
        $.each(curOrder,function(index,value){
            let atId = value.id;
            $.each(sorted,function(in2,val2){
                if(val2 === atId) newAr[in2] = value;
            });
        });
        inputEl.val(JSON.stringify(newAr));
    };



    $(function(){
        $('.woocp_select2').select2();

        $('#_woocp_product_components_select,.woocp_attributes_select').val('placeholder');

        $('#woocp_product_components_list').sortable({
            opacity: 0.6,
            cursor: 'move',
            handle: '.sorthandle',
            placeholder: "ui-state-highlight"
        });
        $('#woocp_product_components_list .woocp_product_component').each(function(){
            $(this).woocpAttrSortable();
        });
    });

    $(document).on('click','.woocp_add_product_component',function(e){
        e.preventDefault();
        $(this).woocpAddProductComponent();
    });
    $(document).on('click','.woocp_save_product_components',function(e){
        e.preventDefault();
        $('.spinner.woocp_save_components').css('visibility','visible');
        $(this).woocpSaveProductComponents();
    });
    $(document).on('click','.woocp_delete_product_component',function(e){
        e.preventDefault();
        $(this).woocpDeleteProductComponent();
    });

    $(document).on('mouseenter','.woocp_options_select_container',function(){
        $(this).find('.woocp_remove_attribute').removeClass('hide');
    });
    $(document).on('mouseleave','.woocp_options_select_container',function(){
        $(this).find('.woocp_remove_attribute').addClass('hide');
    });

    $(document).on('click','.woocp_remove_attribute',function(e){
        e.preventDefault();
        $(this).woocpDeleteComponentAttribute();
    });
    $(document).on('click','.woocp_add_component_attribute',function(e){
        e.preventDefault();
        $(this).woocpAddComponentAttribute();
    });
    $(document).on('click','.woocp_select2_buttons .select_all_options',function(e){
        e.preventDefault();
        $(this).closest('.woocp_options_select_container').find('.woocp_select2 option').prop("selected",true).trigger("change");
    });
    $(document).on('click','.woocp_select2_buttons .clear_all_options',function(e){
        e.preventDefault();
        $(this).closest('.woocp_options_select_container').find('.woocp_select2 option').prop("selected",false).trigger("change");
    });
    $(document).on('change','.woocp_attribute_options_select',function(){
        $(this).woocpUpdateAttributeOption();
        $('.woocp_message .msg1').fadeIn(aniTime2);
    });
    $('#woocp_product_components_list_container').on('click','.woocp_expand_components,.woocp_close_components',function(e){
        e.preventDefault();
        if($(this).hasClass('woocp_expand_components')){
            $('#woocp_product_components_list_container .woocp_product_component.closed').each(function(){
                $(this).find('h3').click();
            });
        }
        else if($(this).hasClass('woocp_close_components')){
            $('#woocp_product_components_list_container .woocp_product_component.open').each(function(){
                $(this).find('h3').click();
            });
        }
    });

    $(document).on('sortstart','#woocp_product_components_list',function(e,ui){
        if(ui.item.hasClass('woocp_product_component')) ui.item.attr('data-startindex',ui.item.index());
    });
    $(document).on('sortupdate','#woocp_product_components_list',function(e,ui){
        if(ui.item.hasClass('woocp_product_component')) ui.item.woocpSortComponents();
        ui.item.woocpSortAttributes();
        woocpGetFullArray();
    });



    function woocpGetFullArray(){
        let fullArray = [];
        let i = 0;
        let inputComponents = $('input[name="_woocp_product_components"]');
        $('input[name^="woocp_component_attributes_"]').each(function(){
            let caId = $(this).closest('.woocp_product_component').attr('data-componentId');
            let componentRequiredOverride = $('input[name="component_required_override_'+caId+'"]').prop('checked');
            let componentRequired = $('input[name="component_required_'+caId+'"]').prop('checked');
            let label = $('input[name="component_label_'+caId+'"]').val();
            let fee = $('input[name="component_fee_'+caId+'"]').val();
            let desc = $('textarea[name="woocp_component_description_'+caId+'"]').val();
            let newObj = {};
            let attachedAttr = JSON.parse($(this).val());

            //attach whole component object to fullArray
            if(!(caId in fullArray)){
                newObj['id'] = caId;
                newObj['component_required_override'] = componentRequiredOverride;
                newObj['component_required'] = componentRequired;
                newObj['label'] = label;
                newObj['fee'] = fee;
                newObj['description'] = desc;
                newObj['attrs'] = attachedAttr;
                fullArray[i] = newObj;
                i++;
            }
        });
        if(Object.keys(fullArray).length < 1){
            fullArray = JSON.parse(inputComponents.val());
        }
        fullArray = JSON.stringify(fullArray);
        inputComponents.val(fullArray);
        return fullArray;
    }

})( jQuery );


