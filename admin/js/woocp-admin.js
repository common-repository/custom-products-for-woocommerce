// noinspection JSUnresolvedVariable
(function ($) {
    'use strict';
    let aniTime = 500;	//slow
    let aniTime2 = 250;	//fast
    let aniTime3 = 150;	//faster
    //let aniTime4 = 75;	//super fast
    let licenseMsgH = 60;

    $.fn.woocpOpenProductPanel = function () {
        if ($(this).prop('checked') === true) $('#woocp_product_customizer_wrapper').removeClass('hide');
        else $('#woocp_product_customizer_wrapper').addClass('hide');
    };

    $.fn.woocpCustomizerMediaUploader = function () {
        let mediaUploader;

        if (mediaUploader) {
            mediaUploader.open();
            return;
        }

        mediaUploader = wp.media.frames.file_frame = wp.media({
            title: 'Choose Image',
            button: {
                text: 'Choose Image'
            }, multiple: false
        });

        // noinspection JSCheckFunctionSignatures
        mediaUploader.on('select', function () {
            $('.spinner.woocp_save_customizer_image').css('visibility', 'visible');
            let attachment = mediaUploader.state().get('selection').first().toJSON();
            $('#woocp_customizer_image_id').val(attachment.id);
            $('#woocp_customizer_image').attr('src', attachment.url);
            saveCustomizerImage();
            $(document).trigger('woocp-customizer-image-updated');
        });
        mediaUploader.open();
    };
    $.fn.woocpAttributeMediaUploader = function () {
        let mediaUploader;

        if (mediaUploader) {
            mediaUploader.open();
            return;
        }

        mediaUploader = wp.media.frames.file_frame = wp.media({
            title: 'Choose Image',
            button: {
                text: 'Choose Image'
            }, multiple: false
        });

        // noinspection JSCheckFunctionSignatures
        mediaUploader.on('select', function () {
            let attachment = mediaUploader.state().get('selection').first().toJSON();
            $('#woocp_taxonomy_image_id').val(attachment.id);
            $('#woocp_taxonomy_image_wrapper').html('<img alt="' + attachment.url + '" src="' + attachment.url + '"/>');
        });
        mediaUploader.open();
    };

    $.fn.woocpUpdateCustomizableClick = function () {
        $('.spinner.woocp_update_customizable').css('visibility', 'visible');
        $(this).woocpOpenProductPanel();
        $(this).woocpUpdateCustomizable();
    };

    $.fn.woocpUpdateCustomizable = function () {
        let postId = $('input[name="post_ID"]').val();
        let customizable = $('input[name="_woocp_is_customizable"]').prop('checked');
        let val = 0;
        if (customizable) val = 1;
        let data = {
            'action': 'woocp_update_customizable',
            'postId': postId,
            '_woocp_is_customizable': val,
        };

        // noinspection JSUnresolvedVariable,JSUnusedLocalSymbols
        jQuery.post(ajaxurl, data, function (response) {
            $('.spinner.woocp_update_customizable').css('visibility', 'hidden');
        });
    };

    $.fn.woocpRemoveCustomizerImage = function () {
        let postId = $('input[name="post_ID"]').val();
        let data = {
            'action': 'woocp_remove_customizer_image',
            'postId': postId,
        };

        // noinspection JSUnresolvedVariable,JSUnusedLocalSymbols
        jQuery.post(ajaxurl, data, function (response) {
            $('.spinner.woocp_save_customizer_image').css('visibility', 'hidden');
            $('#woocp_customizer_image').attr('src', $('#woocp_customizer_image_original').attr('src'));
        });
    };

    $(function () {

        $('#_woocp_is_customizable').each(function () {
            $(this).woocpOpenProductPanel();
        });

        $('#woocp_product_customizer_tabs').tabs();

        $('.wp-list-table #woocp_component_image > a > span:first-child').each(function () {
            $(this).addClass('woocp_component_image_icon');
        });

        $('input.disabled,select.disabled,textarea.disabled').each(function () {
            $(this).attr('disabled', 'disabled');
        });
        $('input.readonly,select.readonly,textarea.readonly').each(function () {
            $(this).attr('readonly', 'readonly');
        });

        $('input[type="number"]:not(#woocp_customizer_tab_priority)').attr('min', 0);
        $('input[name="woocp_customizer_image_width"]').attr('max', 100).attr('min', 1);

        $('#woocp_custom_css_help').each(function () {
            $(this).attr('data-height', $(this).height()).height(0).css('opacity', 1);
        });

        woocpReplaceChekboxesWithSwitches();

    });

    $(window).on('load', function () {
        $('.woocp_select2').select2();
        woocpResetTipTip();
    });
    $(document).on('click', '.upgrade_notice .notice-dismiss', function () {
        let type = $(this).closest('.upgrade_notice').data('notice');
        let data = {
            action: 'woocp_dismissed_notice_handler',
            type: type,
        };
        // noinspection JSUnresolvedVariable
        jQuery.post(ajaxurl, data, function (response) {

        });
    });
    $(document).on('click', '#_woocp_is_customizable', function () {
        $(this).woocpUpdateCustomizableClick();
    });
    $(document).on('click', '#woocp_add_attribute_image_button', function (e) {
        e.preventDefault();
        $(this).woocpAttributeMediaUploader();
        return false;
    });
    $(document).on('click', '#woocp_remove_attribute_image_button', function () {
        $('#woocp_taxonomy_image_id').val('');
        $('#woocp_taxonomy_image_wrapper').html('');
    });
    $(document).on('click', '#woocp_add_customizer_image_button', function (e) {
        e.preventDefault();
        $(this).woocpCustomizerMediaUploader();
        return false;
    });
    $(document).on('click', '#woocp_remove_customizer_image_button', function (e) {
        $('.spinner.woocp_save_customizer_image').css('visibility', 'visible');
        e.preventDefault();
        $(this).woocpRemoveCustomizerImage();
        return false;
    });

    $(document).on('click', '#woocp_product_customizer_container label', function () {
        let lFor = $(this).attr('for');
        let target = $('*[name="' + lFor + '"]');
        if (target.tagName === 'input' && target.attr('type') === 'input') target.click();
        if (target.tagName === 'input' && target.attr('type') === 'checkbox') target.click();
    });

    window.woocpResetTipTip = function () {
        if (typeof $(document).tipTip !== 'undefined') {
            let tiptip_args = {
                'attribute': 'data-tip',
                'fadeIn': 50,
                'fadeOut': 50,
                'delay': 200
            };
            $('.woocommerce-help-tip,.woocp_pro_label.tips').tipTip(tiptip_args);
        }
    }

    $(document).on('click', 'div.woocp_switch', function (e) {
        e.preventDefault();
        let el = $(this).find('input');

        el.prop('checked', !el.prop('checked'));

        if (el.attr('id') === '_woocp_is_customizable') {
            el.woocpUpdateCustomizableClick();
        }

        return false;
    });

    function saveCustomizerImage() {
        let postId = $('input[name="post_ID"]').val();
        let data = {
            action: 'woocp_save_customizer_image',
            postId: postId,
            image_id: $('#woocp_customizer_image_id').val(),
        };
        // noinspection JSUnresolvedVariable,JSUnusedLocalSymbols
        jQuery.post(ajaxurl, data, function (response) {
            $('.spinner.woocp_save_customizer_image').css('visibility', 'hidden');
        });
    }

    function woocpReplaceChekboxesWithSwitches() {
        $('.woocp_settings input[type="checkbox"][name*="woocp"]').each(function () {
            let el = $(this);

            let elClone = el.clone();

            // noinspection JSUnresolvedVariable
            $(
                '<div class="woocp_switch">' +
                elClone[0].outerHTML +
                '<div class="woocp_slider round">' +
                '<span class="woocp_on">' + adminObject.stringYes + '</span>' +
                '<span class="woocp_off">' + adminObject.stringNo + '</span>' +
                '</div>' +
                '</div>'
            ).insertAfter(el);
            el.remove();
        });
    }

})(jQuery);


