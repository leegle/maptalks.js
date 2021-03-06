Z.symbolizer.ImageMarkerSymbolizer = Z.symbolizer.PointSymbolizer.extend({

    defaultSymbol:{
        'markerOpacity' : 1,
        'markerWidth' : null,
        'markerHeight' : null,
        'markerDx': 0,
        'markerDy': 0
    },

    initialize:function (symbol, geometry) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.style = this._defineStyle(this.translate());
    },


    symbolize:function (ctx, resources) {
        var style = this.style;
        if (style['markerWidth'] === 0 || style['markerHeight'] === 0 || style['markerOpacity'] === 0) {
            return;
        }
        var cookedPoints = this._getRenderContainerPoints();
        if (!Z.Util.isArrayHasData(cookedPoints)) {
            return;
        }

        var img = this._getImage(resources);
        if (!img) {
            if (!Z.Browser.phantomjs) {
                Z.Util.warn('no img found for ' + (this.style['markerFile'] || this._url[0]));
            }
            return;
        }
        this._prepareContext(ctx);
        var width = style['markerWidth'];
        var height = style['markerHeight'];
        if (!Z.Util.isNumber(width) || !Z.Util.isNumber(height)) {
            width = img.width;
            height = img.height;
            style['markerWidth'] = width;
            style['markerHeight'] = height;
            var imgURL = [style['markerFile'], style['markerWidth'], style['markerHeight']];
            if (!resources.isResourceLoaded(imgURL)) {
                resources.addResource(imgURL, img);
            }
            this.geometry._getPainter().removeCache();
        }
        var alpha;
        if (!(this instanceof Z.symbolizer.VectorPathMarkerSymbolizer) &&
            Z.Util.isNumber(style['markerOpacity']) && style['markerOpacity'] < 1)  {
            alpha = ctx.globalAlpha;
            ctx.globalAlpha *= style['markerOpacity'];
        }
        var p;
        for (var i = 0, len = cookedPoints.length; i < len; i++) {
            p = cookedPoints[i];
            var origin = this._rotate(ctx, p, this._getRotationAt(i));
            if (origin) {
                p = origin;
            }
            //图片定位到中心底部
            Z.Canvas.image(ctx, img,
                p.x - width / 2,
                p.y - height,
                width, height);
            if (origin) {
                ctx.restore();
            }
        }
        if (alpha !== undefined) {
            ctx.globalAlpha = alpha;
        }
    },

    _getImage:function (resources) {
        var img = !resources ? null : resources.getImage([this.style['markerFile'], this.style['markerWidth'], this.style['markerHeight']]);
        return img;
    },

    getPlacement:function () {
        return this.symbol['markerPlacement'];
    },

    getRotation: function () {
        var r = this.style['markerRotation'];
        if (!Z.Util.isNumber(r)) {
            return null;
        }
        //to radian
        return r * Math.PI / 180;
    },

    getDxDy:function () {
        var s = this.style;
        var dx = s['markerDx'],
            dy = s['markerDy'];
        return new Z.Point(dx, dy);
    },

    getMarkerExtent:function () {
        var width = this.style['markerWidth'],
            height = this.style['markerHeight'];
        var dxdy = this.getDxDy();
        var extent = new Z.PointExtent(dxdy.add(-width / 2, 0), dxdy.add(width / 2, -height));
        return extent;
    },

    translate:function () {
        var s = this.symbol,
            d = this.defaultSymbol;
        return Z.Util.extend({}, d, s);
    }
});


Z.symbolizer.ImageMarkerSymbolizer.test = function (symbol) {
    if (!symbol) {
        return false;
    }
    if (!Z.Util.isNil(symbol['markerFile'])) {
        return true;
    }
    return false;
};
