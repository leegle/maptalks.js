/**
 * @namespace
 */
Z.control = {};

/**
 * Base class for all the map controls, you can extend it to build your own customized Control.
 * It is abstract and not intended to be instantiated.
 * @class
 * @category control
 * @abstract
 * @extends maptalks.Class
 * @memberOf maptalks.control
 * @name  Control
 *
 * @mixes maptalks.Eventable
 */
Z.control.Control = Z.Class.extend(/** @lends maptalks.control.Control.prototype */{
    includes: [Z.Eventable],

    statics : {
        'positions' : {
            'top-left' : {'top': '20', 'left': '20'},
            'top-right' : {'top': '40', 'right': '60'},
            'bottom-left' : {'bottom': '20', 'left': '60'},
            'bottom-right' : {'bottom': '20', 'right': '60'}
        }
    },

    initialize: function (options) {
        if (options && options['position'] && !Z.Util.isString(options['position'])) {
            options['position'] = Z.Util.extend({}, options['position']);
        }
        Z.Util.setOptions(this, options);
    },

    /**
     * Adds the control to a map.
     * @param {maptalks.Map} map
     * @returns {maptalks.control.Control} this
     * @fires maptalks.control.Control#add
     */
    addTo: function (map) {
        this.remove();
        this._map = map;
        var controlContainer = map._panels.control;
        this.__ctrlContainer = Z.DomUtil.createEl('div');
        Z.DomUtil.setStyle(this.__ctrlContainer, 'position:absolute');
        Z.DomUtil.addStyle(this.__ctrlContainer, 'z-index', controlContainer.style.zIndex);
        // Z.DomUtil.on(this.__ctrlContainer, 'mousedown mousemove click dblclick contextmenu', Z.DomUtil.stopPropagation)
        this.update();
        controlContainer.appendChild(this.__ctrlContainer);
        /**
         * add event.
         *
         * @event maptalks.control.Control#add
         * @type {Object}
         * @property {String} type - add
         * @property {maptalks.control.Control} target - the control instance
         */
        this.fire('add', {'dom' : controlContainer});
        return this;
    },

    /**
     * update control container
     * @return {maptalks.control.Control} this
     */
    update: function () {
        this.__ctrlContainer.innerHTML = '';
        this._controlDom = this.buildOn(this.getMap());
        if (this._controlDom) {
            this._updatePosition();
            this.__ctrlContainer.appendChild(this._controlDom);
        }
        return this;
    },

    /**
     * Get the map that the control is added to.
     * @return {maptalks.Map}
     */
    getMap:function () {
        return this._map;
    },

    /**
     * Get the position of the control
     * @return {Object}
     */
    getPosition: function () {
        return Z.Util.extend({}, this._parse(this.options['position']));
    },

    /**
     * update the control's position
     * @param {String|Object} position - can be one of 'top-left', 'top-right', 'bottom-left', 'bottom-right' or a position object like {'top': 40,'left': 60}
     * @return {maptalks.control.Control} this
     * @fires maptalks.control.Control#positionchange
     */
    setPosition: function (position) {
        if (Z.Util.isString(position)) {
            this.options['position'] = position;
        } else {
            this.options['position'] = Z.Util.extend({}, position);
        }
        this._updatePosition();
        return this;
    },

    /**
     * Get the container point of the control.
     * @return {maptalks.Point}
     */
    getContainerPoint:function () {
        var position = this.getPosition();

        var size = this.getMap().getSize();
        var x, y;
        if (!Z.Util.isNil(position['top'])) {
            x = position['top'];
        } else if (!Z.Util.isNil(position['bottom'])) {
            x = size['height'] - position['bottom'];
        }
        if (!Z.Util.isNil(position['left'])) {
            y = position['left'];
        } else if (!Z.Util.isNil(position['right'])) {
            y = size['width'] - position['right'];
        }
        return new Z.Point(x, y);
    },

    /**
     * Get the control's container.
     * Container is a div element wrapping the control's dom and decides the control's position and display.
     * @return {HTMLElement}
     */
    getContainer: function () {
        return this.__ctrlContainer;
    },

    /**
     * Get html dom element of the control
     * @return {HTMLElement}
     */
    getDOM: function () {
        return this._controlDom;
    },

    /**
     * Show
     * @return {maptalks.control.Control} this
     */
    show: function () {
        this.__ctrlContainer.style.display = '';
        return this;
    },

    /**
     * Hide
     * @return {maptalks.control.Control} this
     */
    hide: function () {
        this.__ctrlContainer.style.display = 'none';
        return this;
    },

    /**
     * Whether the control is visible
     * @return {Boolean}
     */
    isVisible:function () {
        return (this.__ctrlContainer && this.__ctrlContainer.style.display === '');
    },

    /**
     * Remove itself from the map
     * @return {maptalks.control.Control} this
     * @fires maptalks.control.Control#remove
     */
    remove: function () {
        if (!this._map) {
            return this;
        }
        Z.DomUtil.removeDomNode(this.__ctrlContainer);
        if (this.onRemove) {
            this.onRemove();
        }
        delete this._map;
        delete this.__ctrlContainer;
        delete this._controlDom;
        /**
         * remove event.
         *
         * @event maptalks.control.Control#remove
         * @type {Object}
         * @property {String} type - remove
         * @property {maptalks.control.Control} target - the control instance
         */
        this.fire('remove');
        return this;
    },

    _parse: function (position) {
        var p = position;
        if (Z.Util.isString(position)) {
            p = Z.control.Control['positions'][p];
        }
        return p;
    },

    _updatePosition: function () {
        var position = this.getPosition();
        if (!position) {
            //default one
            position = {'top': 20, 'left': 20};
        }
        for (var p in position) {
            if (position.hasOwnProperty(p)) {
                position[p] = parseInt(position[p]);
                this.__ctrlContainer.style[p] = position[p] + 'px';
            }
        }
        /**
         * Control's position update event.
         *
         * @event maptalks.control.Control#positionchange
         * @type {Object}
         * @property {String} type - positionchange
         * @property {maptalks.control.Control} target - the control instance
         * @property {Object} position - Position of the control, eg:{"top" : 100, "left" : 50}
         */
        this.fire('positionchange', {
            'position' : Z.Util.extend({}, position)
        });
    }

});

Z.Map.mergeOptions({

    'control' : true
});

Z.Map.include(/** @lends maptalks.Map.prototype */{
    /**
     * Add a control on the map.
     * @param {maptalks.control.Control} control - contorl to add
     * @return {maptalks.Map} this
     */
    addControl: function (control) {
        //map container is a canvas, can't add control on it.
        if (!this.options['control'] || this._containerDOM.getContext) {
            return this;
        }
        control.addTo(this);
        return this;
    },

    /**
     * Remove a control from the map.
     * @param {maptalks.control.Control} control - control to remove
     * @return {maptalks.Map} this
     */
    removeControl: function (control) {
        if (!control || control.getMap() !== this) {
            return this;
        }
        control.remove();
        return this;
    }

});
