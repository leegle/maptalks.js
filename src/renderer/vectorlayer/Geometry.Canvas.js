//如果不支持canvas, 则不载入canvas的绘制逻辑
if (Z.Browser.canvas) {

    var ellipseReources = {
        _getRenderCanvasResources:function () {
            var map = this.getMap();
            var pcenter = this._getPrjCoordinates();
            var pt = map._prjToPoint(pcenter);
            var size = this._getRenderSize();
            return {
                'fn' : Z.Canvas.ellipse,
                'context' : [pt, size['width'], size['height']]
            };
        }
    };

    Z.Ellipse.include(ellipseReources);

    Z.Circle.include(ellipseReources);
    //----------------------------------------------------
    Z.Rectangle.include({
        _getRenderCanvasResources:function () {
            var map = this.getMap();
            var pt = map._prjToPoint(this._getPrjCoordinates());
            var size = this._getRenderSize();
            return {
                'fn' : Z.Canvas.rectangle,
                'context' : [pt, size]
            };
        }
    });
    //----------------------------------------------------
    Z.Sector.include({
        _getRenderCanvasResources:function () {
            var map = this.getMap();
            var pcenter = this._getPrjCoordinates();
            var pt = map._prjToPoint(pcenter);
            var size = this._getRenderSize();
            return {
                'fn' : Z.Canvas.sector,
                'context' : [pt, size['width'], [this.getStartAngle(), this.getEndAngle()]]
            };
        }

    });
    //----------------------------------------------------

    Z.Polyline.include({
        arrowStyles : {
            'classic' : [2, 5]
        },

        _arrow: function (ctx, prePoint, point, opacity, arrowStyle) {
            var style = this.arrowStyles[arrowStyle];
            if (!style) {
                return;
            }
            var lineWidth = this._getInternalSymbol()['lineWidth'];
            if (!lineWidth || lineWidth < 3) {
                lineWidth = 3;
            }

            var arrowWidth = lineWidth * style[0],
                arrowHeight = lineWidth * style[1],
                hh = arrowHeight,
                hw = arrowWidth / 2;

            var v0 = new Z.Point(0, lineWidth),
                v1 = new Z.Point(-hw, hh),
                v2 = new Z.Point(hw, hh);
            var pts = [v0, v1, v2, v0];
            var angle = Math.atan2(point.x - prePoint.x, prePoint.y - point.y);
            var matrix = new Z.Matrix().translate(point.x, point.y).rotate(angle);
            var ptsToDraw = matrix.applyToArray(pts);
            Z.Canvas.polygon(ctx, ptsToDraw, opacity, opacity);
        },

        _getRenderCanvasResources:function () {
            //draw a triangle arrow

            var prjVertexes = this._getPrjCoordinates();
            var points = this._getPath2DPoints(prjVertexes);

            var me = this;
            var fn = function (_ctx, _points, _lineOpacity, _fillOpacity, _dasharray) {
                Z.Canvas.path(_ctx, _points, _lineOpacity, null, _dasharray);
                if (_ctx.setLineDash && Z.Util.isArrayHasData(_dasharray)) {
                    //remove line dash effect if any
                    _ctx.setLineDash([]);
                }
                if (me.options['arrowStyle'] && _points.length >= 2) {
                    var placement = me.options['arrowPlacement'];
                    if (placement === 'vertex-first' || placement === 'vertex-firstlast') {
                        me._arrow(_ctx, _points[1], _points[0], _lineOpacity, me.options['arrowStyle']);
                    }
                    if (placement === 'vertex-last' || placement === 'vertex-firstlast') {
                        me._arrow(_ctx, _points[_points.length - 2], _points[_points.length - 1], _lineOpacity, me.options['arrowStyle']);
                    }
                    if (placement === 'point') {
                        for (var i = 0, len = _points.length - 1; i < len; i++) {
                            me._arrow(_ctx, _points[i], _points[i + 1], _lineOpacity, me.options['arrowStyle']);
                        }
                    }
                }
            };
            return {
                'fn' : fn,
                'context' : [points]
            };
        }
    });

    Z.Polygon.include({
        _getRenderCanvasResources:function () {
            var prjVertexes = this._getPrjCoordinates(),
                points = this._getPath2DPoints(prjVertexes),
                //splitted by anti-meridian
                isSplitted = points.length > 0 && Z.Util.isArray(points[0]);
            if (isSplitted) {
                points = [[points[0]], [points[1]]];
            }
            var prjHoles = this._getPrjHoles();
            var holePoints = [];
            if (Z.Util.isArrayHasData(prjHoles)) {
                var hole;
                for (var i = 0; i < prjHoles.length; i++) {
                    hole = this._getPath2DPoints(prjHoles[i]);
                    if (isSplitted) {
                        if (Z.Util.isArray(hole)) {
                            points[0].push(hole[0]);
                            points[1].push(hole[1]);
                        } else {
                            points[0].push(hole);
                        }
                    } else {
                        holePoints.push(hole);
                    }

                }
            }
            var resource =  {
                'fn' : Z.Canvas.polygon,
                'context' : [isSplitted ? points : [points].concat(holePoints)]
            };
            return resource;
        }
    });
}
