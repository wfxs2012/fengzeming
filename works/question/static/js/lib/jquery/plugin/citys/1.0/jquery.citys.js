/**
 * jquery.citys.js 1.0
 * http://jquerywidget.com
 */
!(function ( root , factory ) {
    'use strict';
    if ( typeof define === 'function' ) {
        if ( define.amd ) {
            // AMD
            define ( ['jquery'] , factory );
        }
    } else {
        // 浏览器全局变量(root 即 window)
        root.returnExports = factory ( root.jQuery );
    }
} ( this , function ( $ ) {
    'use strict';

    var initData = function ( data , options , _api , $province , $city , $area , getApi ) {
        var province , city , area , hasCity;
        if ( options.code ) {   //如果设置地区编码，则忽略单独设置的信息
            var c = options.code - options.code % 1e4;
            if ( data[c] ) {
                options.province = c;
            }
            c = options.code - (options.code % 1e4 ? options.code % 1e2 : options.code);
            if ( data[c] ) {
                options.city = c;
            }
            c = options.code % 1e2 ? options.code : 0;
            if ( data[c] ) {
                options.area = c;
            }
        }
        var updateData = function () {
            province = {}, city = {}, area = {};
            hasCity = false;       //判断是非有地级城市

            for ( var cod in data ) {

                if ( !(cod % 1e4) ) {     //获取所有的省级行政单位
                    province[cod] = data[cod];
                    if ( options.required && !options.province ) {
                        if ( options.city && !(options.city % 1e4) ) {  //省未填，并判断为直辖市
                            options.province = options.city;
                        } else {
                            options.province = cod;
                        }
                    } else if ( data[cod].indexOf ( options.province ) > -1 ) {
                        options.province = isNaN ( options.province ) ? cod : options.province;
                    }
                } else {
                    var p = cod - options.province;
                    if ( options.province && p > 0 && p < 1e4 ) {    //同省的城市或地区
                        if ( !(cod % 100) ) {
                            hasCity = true;
                            city[cod] = data[cod];
                            if ( options.required && !options.city ) {
                                options.city = cod;
                            } else if ( data[cod].indexOf ( options.city ) > -1 ) {
                                options.city = isNaN ( options.city ) ? cod : options.city;
                            }
                        } else if ( p > 9000 ) {                   //省直辖县级行政单位
                            city[cod] = data[cod];
                        } else if ( hasCity ) {                  //非直辖市
                            var c = cod - options.city;
                            if ( options.city && c > 0 && c < 100 ) {     //同个城市的地区
                                area[cod] = data[cod];
                                if ( options.required && !options.area ) {
                                    options.area = cod;
                                } else if ( data[cod].indexOf ( options.area ) > -1 ) {
                                    options.area = isNaN ( options.area ) ? cod : options.area;
                                }
                            }
                        } else {
                            city[cod] = data[cod];            //直辖市
                            if ( options.area ) {
                                options.city = options.area;
                                options.area = '';
                            }
                            if ( options.required && !options.city ) {
                                options.city = cod;
                            } else if ( data[cod].indexOf ( options.city ) > -1 ) {
                                options.city = isNaN ( options.city ) ? cod : options.city;
                            }
                        }
                    }
                }
            }
        };
        var format = {
            province : function () {
                $province.empty ();
                if ( !options.required ) {
                    $province.append ( '<option value=""> - 请选择 - </option>' );
                }
                for ( var i in province ) {
                    $province.append ( '<option value="' + i + '">' + province[i] + '</option>' );
                }
                if ( options.province ) {
                    $province.val ( options.province );
                }
                this.city ();
            } ,
            city     : function () {
                $city.empty ();
                if ( !options.required ) {
                    $city.append ( '<option value=""> - 请选择 - </option>' );
                }
                if ( options.nodata == 'disabled' ) {
                    $city.prop ( 'disabled' , $.isEmptyObject ( city ) );
                } else if ( options.nodata == 'hidden' ) {
                    $city.css ( 'display' , $.isEmptyObject ( city ) ? 'none' : '' );
                }
                for ( var i in city ) {
                    $city.append ( '<option value="' + i + '">' + city[i] + '</option>' );
                }
                if ( options.city ) {
                    $city.val ( options.city );
                }
                this.area ();
            } ,
            area     : function () {
                $area.empty ();
                if ( !hasCity ) {
                    $area.css ( 'display' , 'none' );
                } else {
                    $area.css ( 'display' , '' );
                    if ( !options.required ) {
                        $area.append ( '<option value=""> - 请选择 - </option>' );
                    }
                    if ( options.nodata == 'disabled' ) {
                        $area.prop ( 'disabled' , $.isEmptyObject ( area ) );
                    } else if ( options.nodata == 'hidden' ) {
                        $area.css ( 'display' , $.isEmptyObject ( area ) ? 'none' : '' );
                    }
                    for ( var i in area ) {
                        $area.append ( '<option value="' + i + '">' + area[i] + '</option>' );
                    }
                    if ( options.area ) {
                        $area.val ( options.area );
                    }
                }
            }
        };
        //获取当前地理信息
        _api.getInfo = function () {
            var status = {
                direct   : !hasCity ,
                province : data[options.province] || '' ,
                city     : data[options.city] || '' ,
                area     : data[options.area] || '' ,
                code     : options.area || options.city || options.province
            };
            return status;
        };
        //事件绑定
        $province.on ( 'change' , function () {
            options.province = $ ( this ).val ();
            options.city = 0;
            options.area = 0;
            updateData ();
            format.city ();
            options.onChange ( _api.getInfo () );
        } );
        $city.on ( 'change' , function () {
            options.city = $ ( this ).val ();
            options.area = 0;
            updateData ();
            format.area ();
            options.onChange ( _api.getInfo () );
        } );
        $area.on ( 'change' , function () {
            options.area = $ ( this ).val ();
            options.onChange ( _api.getInfo () );
        } );
        //初始化
        updateData ();
        format.province ();
        getApi ( _api );
    };

    $.fn.citys = function ( parameter , getApi ) {
        if ( typeof parameter == 'function' ) { //重载
            getApi = parameter;
            parameter = {};
        } else {
            parameter = parameter || {};
            getApi = getApi || function () {
                };
        }
        var defaults = {
            dataUrl       : 'http://passer-by.com/data_location/list.json' ,     //数据库地址
            type          : 1 ,          //1 是 json  2 是 ajax
            dataType      : 'json' ,          //数据库类型:'json'或'jsonp'
            provinceField : 'province' , //省份字段名
            cityField     : 'city' ,         //城市字段名
            areaField     : 'area' ,         //地区字段名
            code          : 0 ,                   //地区编码
            province      : 0 ,               //省份,可以为地区编码或者名称
            city          : 0 ,                   //城市,可以为地区编码或者名称
            area          : 0 ,                   //地区,可以为地区编码或者名称
            required      : true ,           //是否必须选一个
            nodata        : 'hidden' ,         //当无数据时的表现形式:'hidden'隐藏,'disabled'禁用,为空不做任何处理
            onChange      : function () {
            }     //地区切换时触发,回调函数传入地区数据
        };
        var options = $.extend ( {} , defaults , parameter );
        return this.each ( function () {
            //对象定义
            var _api = {};
            var $this = $ ( this );
            var $province = $this.find ( 'select[name="' + options.provinceField + '"]' ) ,
                $city = $this.find ( 'select[name="' + options.cityField + '"]' ) ,
                $area = $this.find ( 'select[name="' + options.areaField + '"]' );

            if ( options.type === 1 ) {
                initData ( options.dataUrl , options , _api , $province , $city , $area , getApi );
            } else {
                $.ajax ( {
                    url           : options.dataUrl ,
                    type          : 'GET' ,
                    dataType      : options.dataType ,
                    jsonpCallback : 'jsonp_location' ,
                    success       : function ( data ) {
                        initData ( data , options , _api , $province , $city , $area , getApi );
                    }
                } );
            }

        } );
    };
} ));