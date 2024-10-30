<?php /** @noinspection PhpToStringImplementationInspection */
/** @noinspection SpellCheckingInspection */

/**
 * WOOCP components class
 *
 * @since      1.0.0
 * @package    WOOCP
 * @subpackage WOOCP/components
 * @author     Grega Radelj <info@grrega.com>
 */
class WOOCP_Components extends WOOCP {

	protected $woocp;

	protected $version;

	/** @noinspection PhpMissingParentConstructorInspection */
	public function __construct( $woocp, $version ) {

		$this->woocp = $woocp;
		$this->version = $version;
		$this->settings = $this->woocp_return_settings();
		if(!is_object($this->settings)) $this->settings = json_decode(json_encode($this->settings));
		if(!is_object($this->settings)) $this->settings = new stdClass();
	}

	// START COMPONENT REQUIRED

	/**
	 * Adds a "Required" field to add component page
	 *
	 * @since     1.2.0
	 * @param     array  $taxonomy  Passed from the wp hook.
	 * @return    bool
	 * @noinspection PhpUnusedParameterInspection
	 * @noinspection PhpUnused
	 */
	function woocp_add_component_required_field( $taxonomy ) {
		if (!$this->woocp_check_perms()) return false;

		$html = '<tr class="form-field term-fee-wrap">
			<th scope="row">
				<label for="woocp_component_required">'.__('Required', 'custom-products-for-woocommerce').' </label>
			</th>
			<td>
			    <label class="woocp_switch">
                    <input type="checkbox" id="woocp_component_required" name="woocp_component_required">
                    <div class="woocp_slider round">
                        <!--ADDED HTML -->
                        <span class="woocp_on">'.__('YES','custom-products-for-woocommerce').'</span>
                        <span class="woocp_off">'.__('NO','custom-products-for-woocommerce').'</span>
                        <!--END-->
                    </div>
			    </label>
				<p class="description">'.__('Makes this component required.','custom-products-for-woocommerce').'</p>
			</td>
		</tr>';
		echo $html;
		return null;
	}

	/**
	 * Adds a "Required" field to edit component page
	 *
	 * @since     1.2.0
	 * @param     object  $term      Current term(component).
	 * @param     array   $taxonomy  Passed from the wp hook.
	 * @return    bool
	 * @noinspection PhpUnusedParameterInspection
	 * @noinspection PhpUnused
	 */
	function woocp_edit_component_required_field ( $term, $taxonomy ) {
		if (!$this->woocp_check_perms()) return false;

		$val = get_term_meta ( $term -> term_id, 'woocp_component_required', true );

		$checked = $val == 1 ? 'checked="true"' : null;

		$html = '<tr class="form-field term-fee-wrap">
			<th scope="row">
				<label for="woocp_component_required">'.__('Required', 'custom-products-for-woocommerce').' </label>
			</th>
			<td>
			    <label class="woocp_switch">
                    <input type="checkbox" id="woocp_component_required" value="1" name="woocp_component_required" '.$checked.'>
                    <div class="woocp_slider round">
                        <!--ADDED HTML -->
                        <span class="woocp_on">'.__('YES','custom-products-for-woocommerce').'</span>
                        <span class="woocp_off">'.__('NO','custom-products-for-woocommerce').'</span>
                        <!--END-->
                    </div>
			    </label>
				<p class="description">'.__('Makes this component required.','custom-products-for-woocommerce').'</p>
			</td>
		</tr>';
		echo $html;
		return null;
	}

	/**
	 * Saves the component required value to db
	 *
	 * @since     1.2.0
	 * @param     int   $term_id  Term (component) ID.
	 * @param     int   $tt_id    Passed from wp hook.
	 * @return    bool
	 * @noinspection PhpUnusedParameterInspection
	 * @noinspection PhpUnused
	 */
	function woocp_save_component_required( $term_id, $tt_id ) {
		if (!$this->woocp_check_perms()) return false;

		if(isset( $_POST['woocp_component_required'] ) && '' !== $_POST['woocp_component_required']){
			$required = $_POST['woocp_component_required'];
			add_term_meta( $term_id, 'woocp_component_required', $required, true );
		}
		return null;
	}

	/**
	 * Updates the component required field
	 *
	 * @since     1.2.0
	 * @param     int  $term_id  Term (component) ID.
	 * @param     int  $tt_id    Passed from wp hook.
	 * @return    bool
	 * @noinspection PhpUnusedParameterInspection
	 * @noinspection PhpUnused
	 */
	function woocp_update_component_required ( $term_id, $tt_id ) {
		if (!$this->woocp_check_perms()) return false;

		if( isset( $_POST['woocp_component_required'] ) && '' !== $_POST['woocp_component_required'] ){
			$required = $_POST['woocp_component_required'];
			update_term_meta ( $term_id, 'woocp_component_required', $required );
		} else {
			update_term_meta ( $term_id, 'woocp_component_required', '' );
		}
		return null;
	}

	// END COMPONENT REQUIRED

	/**
	 * - Retrieves and echoes the html for the new component edit screen
	 * - Saves the new components array to db
	 *
	 * @since     1.0.0
	 */
	function woocp_add_product_component() {	//AJAX
		if (!$this->woocp_check_perms()) return false;

		$post_id = intval( $_POST['postId'] );
		$component_id = intval( $_POST['componentId'] );
		$product_components = $_POST['_woocp_product_components'];

		$component = $this->woocp_get_components(array($component_id))[0];
		$metabox = $this->woocp_add_component_metabox($component);

		echo $metabox;

		$this->woocp_save_product_components($post_id,$product_components);

		wp_die();
	}

	/**
	 * Retrieves and echoes the html for the new attribute edit screen
	 *
	 * @since     1.0.0
	 */
	function woocp_add_component_attribute() {	//AJAX
		if (!$this->woocp_check_perms()) return false;

		$attrId = intval( $_POST['attributeId'] );

		$attributes = $this->woocp_get_attributes($attrId);
		$attrbox = $this->woocp_add_options_select($attributes[$attrId]);

		echo $attrbox;

		wp_die();
	}

	/**
	 * Gets the html for the component metabox
	 *
	 * @since     1.0.0
	 * @param	  object   $comp  Component.
	 * @return	  string   $html  Html of the component metabox.
	 */
	function woocp_add_component_metabox($comp){
		if (!$this->woocp_check_perms()) return false;

		$attrs = $this->woocp_get_attributes();

		$compId = isset($comp->id) ? $comp->id : $comp->term_id;
		$attached = $comp->attrs !== null ? $comp->attrs : array();
		$component = $this->woocp_get_components(array($compId))[0];
		$label = isset($comp->label) ? $comp->label : null;
		$desc = isset($comp->description) ? $comp->description : null;
		$class1 = ' form-row form-row-first fee';
		$class2 = 'up';

		$required_override = isset($comp->component_required_override) && (bool)$comp->component_required_override;
		if($required_override) $required_override = 'checked="checked"';
		$required = isset($comp->component_required) && (bool)$comp->component_required;
		if($required) $required = 'checked="checked"';

		$html = '
		<div class="woocp_product_component wc-metabox closed taxonomy" data-taxonomy="woocp_product_component" data-componentId="'.$compId.'">
			<h3 class="sorthandle">
				<a href="#" class="woocp_delete_product_component delete">' . __('Remove','custom-products-for-woocommerce') . '</a>
				<div class="handlediv" title="' . __('Click to toggle','custom-products-for-woocommerce') . '" aria-expanded="true"></div>
				<strong>'.$component->name.'</strong>
			</h3>
			<div class="woocp_component_data wc-metabox-content" style="display: none;">
				<div class="component_form">
					<div class="component_form_field_container">
                        <div class="form-field component_required_override">
                            <label for="component_required_override_'.$comp->id.'">'.__('Override this component\'s default "Required" option?', 'custom-products-for-woocommerce').'</label>
                            <div class="woocp_switch">
                                <input type="checkbox" id="component_required_override_'.$compId.'" value="1" name="component_required_override_'.$compId.'" '.$required_override.'>
                                <div class="woocp_slider round">
                                    <!--ADDED HTML -->
                                    <span class="woocp_on">'.__('YES','custom-products-for-woocommerce').'</span>
                                    <span class="woocp_off">'.__('NO','custom-products-for-woocommerce').'</span>
                                    <!--END-->
                                </div>
                            </div>
                        </div>
                        <div class="form-field component_required helptip">
                            <label for="component_required_'.$comp->id.'">'.__('Required component', 'custom-products-for-woocommerce').' '.wc_help_tip(__('Don\'t allow add to cart without selecting an attribute option.<br/>If "Single attribute mode" is enabled only one attribute must be selected, otherwise all are required','custom-products-for-woocommerce-premium'),true).' </label>
                            <div class="woocp_switch">
                                <input type="checkbox" id="component_required_'.$compId.'" value="1" name="component_required_'.$compId.'" '.$required.'>
                                <div class="woocp_slider round">
                                    <!--ADDED HTML -->
                                    <span class="woocp_on">'.__('YES','custom-products-for-woocommerce').'</span>
                                    <span class="woocp_off">'.__('NO','custom-products-for-woocommerce').'</span>
                                    <!--END-->
                                </div>
                            </div>
                        </div>
					</div>
					<p class="form-field'.$class1.'">
						<label class="'.$class2.'" for="component_frontend_name_'.$compId.'">'.__('Name', 'custom-products-for-woocommerce').': '.wc_help_tip(__('Name of the component that will be visible for the current product only. Leave blank to use default component name.','custom-products-for-woocommerce'),true).'</label>
						
						<input type="text" size="50" name="component_label_'.$compId.'" value="'.$label.'" placeholder="'.$component->name.'" />
					</p>
					<p class="form-field'.$class1.' component_description">
					<label class="'.$class2.'" for="woocp_component_description_'.$compId.'">'.__('Description', 'custom-products-for-woocommerce').': '.wc_help_tip(__('Component description that will be visible for the current product only. Leave blank to use default component description.','custom-products-for-woocommerce'),true).'</label>
					<textarea name="woocp_component_description_'.$compId.'" rows="10" cols="10" placeholder="'.$component->description.'" >'.$desc.'</textarea>
					</p>
					<p class="woocp_add_attribute_field">
					<select class="woocp_attributes_select" name="woocp_select_attributes_'.$compId.'">
						<option value="placeholder">' . __('Add attribute','custom-products-for-woocommerce') . '</option>';
		foreach( $attrs as $attr_name => $attr ) {
			$html .= '<option value="' . $attr['attribute_id'] . '">' . $attr['attribute_label'] . '</option>';
		}
		$html .= '</select>
						<button class="button woocp_add_component_attribute left">'.__('Add','custom-products-for-woocommerce').'</button>
						<label class="spinner woocp_add_attribute left"></label>
					</p>
					<input type="hidden" name="woocp_component_attributes_'.$compId.'" value="'.htmlspecialchars(json_encode($attached, JSON_UNESCAPED_UNICODE)).'" autocomplete="off"/>
				</div>
				<div class="woocp_component_attributes_list">';
		foreach( $attached as $atobj ) {
			$attr_id = $atobj->id;
			$options = $atobj->options;
			$fullAttr = $attrs[$attr_id];
			$html .= $this->woocp_add_options_select($fullAttr,$options);
		}
		$html .= '</div>
			</div>
		</div>';
		return $html;
	}

	/**
	 * Gets the html for the new attribute metabox
	 *
	 * @since     1.0.0
	 * @param     array   $attribute  Attribute.
	 * @param     bool    $options    Currently saved options.
	 *
	 * @return    string  $html       Html for the attribute metabox.
	 */
	function woocp_add_options_select($attribute, $options=false){
		if (!$this->woocp_check_perms()) return false;

		$html = '<div class="woocp_options_select_container" data-attributeId="'.$attribute['attribute_id'].'" data-attributeName="'.$attribute['attribute_name'].'">
					<div class="data sorthandle">
						<label>'.__('Name','custom-products-for-woocommerce').':</label>
						<br/>
						<strong>'.$attribute['attribute_label'].'</strong>
					</div>
					<div class="options">
						<label for="woocp_select2_attributes_options_'.$attribute['attribute_id'].'[]">'.__('Value(s)','custom-products-for-woocommerce').':</label>
						<a class="woocp_remove_attribute hide" href="#">'.__('Remove','custom-products-for-woocommerce').'</a>
						<select class="woocp_attribute_options_select woocp_select2" multiple="multiple" name="woocp_select2_attributes_options_'.$attribute['attribute_id'].'[]">';
		foreach( $attribute['options'] as $option ) {
			$selected = (in_array((int) $option->term_id, (array) $options ) ) ? ' selected="selected"' : '';
			$html .= '<option value="' . $option->term_id . '" ' . $selected . '>' . $option->name . '</option>';
		}
		$html .= '</select>
						<div class="woocp_select2_buttons">
							<button class="button plus select_all_options">'.__('Select all','custom-products-for-woocommerce').'</button>
							<button class="button minus clear_all_options">'.__('Select none','custom-products-for-woocommerce').'</button>
						</div>
					</div>
				</div>';
		return $html;
	}

	/**
	 * Saves the product components and product customzation fee (if given) to db
	 * Can be done over ajax or PHP function
	 *
	 * @since     1.0.0
	 * @param     bool  $product_id  Product ID.
	 * @param     bool  $components  Array of components.
	 * @return    bool
	 */
	function woocp_save_product_components( $product_id=false, $components=false){
		if (!$this->woocp_check_perms()) return false;

		$ajax = true;
		if(!$product_id) $product_id = intval( $_POST['postId'] );
		if($components !== false) {
			$insert = $components;
			$ajax = false;
		}
		else if( isset( $_POST['_woocp_product_components'] ) && $_POST['_woocp_product_components'] !== null ) $insert = $_POST['_woocp_product_components'];
		else $insert = '[]';
		if(is_array($insert)) $insert = json_encode($insert);
		$insert = stripslashes($insert);

		update_post_meta( $product_id, '_woocp_product_components', $insert );

		if($ajax) wp_die();
		return null;
	}

}
