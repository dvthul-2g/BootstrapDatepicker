/*jslint white:true, devel:true*/
/*global mx, require, browser, console */
/*mendix */
/*
BootstrapDatepicker
========================

@file      : BootstrapDatepicker.js
@version   : 2.00
@author    : Chris de Gelder
@date      : 16-3-2018
@copyright : Chris de Gelder
@license   : Apache 2
based on https://uxsolutions.github.io/bootstrap-datepicker
 */
// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    'dojo/_base/declare',
    'mxui/widget/_WidgetBase',
    'mxui/dom',
    'dojo/dom-construct',
    'dojo/_base/lang',
    'dojo/text',
    'dojo/_base/kernel',
    'dojo/dom-class',
    'BootstrapDatepicker/lib/jquery',
    'BootstrapDatepicker/lib/bootstrap-datepicker'

], function (declare, _WidgetBase, dom, domConstruct, lang, text, kernel, domClass, _jquery, btdatepicker)
{
    'use strict';
    var $ = _jquery.noConflict(true);
    // Declare widget's prototype.
    return declare('BootstrapDatepicker.widget.BootstrapDatepicker', [_WidgetBase], {

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _contextObj: null,
        selector: null,
        enabled: true,
        date1: null,
        date2: null,
        rangestart: null,
        rangeend: null,
        preventDoublerunning: false,
        mfRunning: false,
        validDates: [],
        dp: null,

        constructor: function ()
        {
            dom.addCss('widgets/BootstrapDatepicker/widget/ui/bootstrap-datepicker3.css');
            this.loadTranslations();
        },

        postCreate: function ()
        {
            var id = this.id + "_cal";
            var div = dom.create('div', {'id': id, 'class': 'bootstrap-datepicker'});
            this.domNode.appendChild(div);
            this.selector = '#' + id + ' input';
            if (this.displaytype === "range" && (this.dateattrto === null || this.dateattrto === undefined || this.dateattr === this.dateattrto))
            {
                this.displaytype = "textinput";
                logger.debug("range without second date attribute provided: fallback to text input");
            }
            var ro = this.readonly ? {readonly: 'true'} : {};
            switch (this.displaytype)
            {
                case "textinput":
                    this.selector = '#' + id + ' input';
                    div.appendChild(dom.create('input', $.extend({
                        'class': 'form-control',
                        'type': 'text',
                        'placeholder': this.inputplaceholder
                    }, ro)));
                    break;
                case "component":
                    this.selector = '#' + id + ' .input-group.date';
                    var groupdiv = div.appendChild(dom.create('div', {'class': 'input-group date'}));
                    groupdiv.appendChild(dom.create('input', $.extend({
                        'class': 'form-control',
                        'type': 'text',
                        'placeholder': this.inputplaceholder
                    }, ro)));
                    var span = dom.create('span', {'class': 'input-group-addon'});
                    groupdiv.appendChild(span);
                    span.appendChild(dom.create('i', {'class': 'glyphicon glyphicon-th'}));
                    break;
                case"startendrange":
                case "embedded":
                    this.selector = '#' + id + '';
                    break;
                case "range":
                    this.selector = '#' + id + ' .input-daterange';
                    var rangediv = div.appendChild(dom.create('div', {
                        'class': 'input-daterange input-group',
                        'id': 'datepicker'
                    }));
                    rangediv.appendChild(dom.create('input', $.extend({
                        'class': 'input-sm form-control',
                        'type': 'text',
                        'name': 'start',
                        'id': 'startTime',
                        'placeholder': this.inputplaceholder
                    }, ro)));
                    rangediv.appendChild(dom.create('span', {'class': 'input-group-addon'}, this.totext || "To"));
                    rangediv.appendChild(dom.create('input', $.extend({
                        'class': 'input-sm form-control',
                        'type': 'text',
                        'name': 'end',
                        'id': 'endTime',
                        'placeholder': this.inputplaceholder
                    }, ro)));
                    break;
            }
            var dateFormat = this.getDateFormat();
            var orientation = this.getOrientation();
            var dp = $(this.selector).datepicker({
                language: dojo.locale,
                calendarWeeks: this.calendarweeks,
                weekStart: this.weekstart,
                todayBtn: this.todaybutton === true ? "Linked" : false,
                clearBtn: this.clearbutton,
                autoclose: this.autoclose,
                daysOfWeekDisabled: this.daysofweekdisabled,
                todayHighlight: this.todayhighlight,
                startDate: this.limitstart,
                endDate: this.limitend,
                enableOnReadonly: false,
                startView: this.startview,
                format: dateFormat,
                beforeShowDay: dojo.hitch(this, this.beforeShowDay),
                multidate: this.displaytype === "startendrange" ? 2 : false,
            });
            dp.on('changeDate', dojo.hitch(this, this.dateChanged));
            dp.on('clearDate', dojo.hitch(this, this.dateCleared));
            this.dp = dp;
        },
        getDateFormat: function ()
        {
            var dateFormat = "";
            if ($.fn.datepicker.dates[dojo.locale.split("-")[0]])
            {
                dateFormat = $.fn.datepicker.dates[dojo.locale.split("-")[0]].format;
            } else if ($.fn.datepicker.dates[dojo.locale])
            {
                dateFormat = $.fn.datepicker.dates[dojo.locale].format;
            } else
            {
                dateFormat = "dd/mm/yyyy";
            }

            if (this.displayFormat)
            {
                dateFormat = this.displayFormat;
            }
            return dateFormat;
        },
        getOrientation: function ()
        {
            var orientation = "";
            if (this.verticalorientation == "auto" && this.horizontalorientation == "auto")
            {
                orientation = "auto";
            } else
            {
                if (this.verticalorientation != "auto")
                {
                    orientation = this.verticalorientation;
                }
                if (this.horizontalorientation != "auto")
                {
                    orientation = orientation + " " + this.horizontalorientation;
                }
            }
            return orientation;
        },

        dateCleared: function ()
        {
            logger.debug('date cleared');
            this.date2 = null;
            if (this.dateattrto)
            {
                this._contextObj.set(this.dateattrto, null);
            }
            this.date1 = null;
            this._contextObj.set(this.dateattr, null);
            this.callmf();
        },

        dateChanged: function (ev)
        {
            if (this.displaytype === "startendrange")
            {
                if (ev.date)
                {
                    ev.date.setHours(this.defaulthours);
                }
                let datescopy = [...ev.dates].sort((a, b) => a - b);
                this.date1 = datescopy[0];
                if (datescopy.length === 2)
                {
                    this.date2 = datescopy[1];
                    this._contextObj.set(this.dateattrto, datescopy[1]);
                } else
                {
                    this.date2 = datescopy[0];
                    this._contextObj.set(this.dateattrto, datescopy[0]);
                }
                this._contextObj.set(this.dateattr, datescopy[0]);
                this.callmf();
                this.callnf();
            } else if (ev.date)
            {
                var d = new Date(ev.date);
                if ((this._contextObj && ev.type == "changeDate" && ev.date && (!isNaN(d.getTime())) && (d.getYear() > 0)))
                {
                    if ((this.date1 === null || ev.date === null || this.date1.getTime() != ev.date.getTime()))
                    {

                        ev.date.setHours(this.defaulthours);
                        // second field for range?
                        if (ev.target.attributes.name && ev.target.attributes.name.value == "end" && this.dateattrto)
                        {
                            this.date2 = ev.date;
                            this._contextObj.set(this.dateattrto, ev.date);
                        } else
                        {
                            logger.debug('set date', ev.date);
                            this.date1 = ev.date;
                            this._contextObj.set(this.dateattr, ev.date);
                        }

                    }
                    this.callmf();
                    this.callnf();
                }

            }
        },

        callmf: function ()
        {
            if (this.mfToExecute)
            {
                if (this.preventDoublerunning)
                {
                    if (this.mfRunning === false)
                    {
                        this.mfRunning = true;
                        var pid = mx.ui.showProgress("", true);
                        mx.data.action({
                            params: {
                                applyto: 'selection',
                                actionname: this.mfToExecute,
                                guids: [this._contextObj.getGuid()]
                            },
                            callback: dojo.hitch(this, function (obj)
                            {
                                this.mfRunning = false;
                                mx.ui.hideProgress(pid);
                            }),
                            error: dojo.hitch(this, function (error)
                            {
                                this.mfRunning = false;
                                mx.ui.hideProgress(pid);
                                logger.debug(this.id + ': An error occurred while executing microflow: ' + error.description);
                            })
                        }, this);
                    } else
                    {
                        logger.debug('skip onChange microflow because that is still running');
                    }
                } else
                {
                    mx.data.action({
                        params: {
                            applyto: 'selection',
                            actionname: this.mfToExecute,
                            guids: [this._contextObj.getGuid()]
                        },
                        callback: dojo.hitch(this, function (obj)
                        {
                        }),
                        error: dojo.hitch(this, function (error)
                        {
                            logger.debug(this.id + ': An error occurred while executing microflow: ' + error.description);
                        })
                    }, this);
                }
            }
        }
        ,
        callnf: function (nanoflow)
        {
            if (this.nanoflow.nanoflow && this.mxcontext)
            {
                logger.debug(this.id + " callnf");
                mx.data.callNanoflow({
                    nanoflow: this.nanoflow,
                    origin: this.mxform,
                    context: this.mxcontext,
                    error: function (error)
                    {
                        mx.ui.error(
                            "An error occurred while executing the Nanoflow: " +
                            error.message
                        );
                        console.error(error.message);
                    }
                });
            }
        }
        ,

        update: function (obj, callback)
        {
            logger.debug('update');
            if (obj)
            {
                if (this._contextObj != obj || obj && this.dateattr && obj.get(this.dateattr) != this.date)
                {
                    this._contextObj = obj;
                    this.resetSubscriptions();
                    this._updateRendering();
                }
            }

            if (callback)
            {
                callback();
            }
        }
        ,

        _updateRendering: function ()
        {
            logger.debug("updaterendering", "renderingupdated");
            var obj = this._contextObj;
            // listen first item
            if (this.date1 === null || this.listentochanges)
            {
                var date1 = new Date(obj.get(this.dateattr));
                var enabled = true;
                if (this.editableattr)
                {
                    enabled = obj.get(this.editableattr);
                }
                if (enabled)
                {
                    this.enable();
                } else
                {
                    this.disable();
                }
                if (this.displaytype == "range" && this.dateattrto)
                {
                    var date2 = new Date(obj.get(this.dateattrto));
                    this.date1 = date1;
                    $(this.selector + ' [name*="start"]').datepicker('setDate', date1);
                    $(this.selector + ' [name*="end"]').datepicker('setDate', date2);
                } else
                {
                    if (date1 != this.date1)
                    {
                        this.date1 = date1;
                        $(this.selector).datepicker('setDate', date1);
                    }
                }
            }
            if (this.dateattrstart && obj && obj.get(this.dateattrstart) && obj.get(this.dateattrstart) != this.rangestart)
            {
                this.rangestart = obj.get(this.dateattrstart);
                $(this.selector).datepicker('setStartDate', new Date(obj.get(this.dateattrstart)));
            }
            if (this.dateattrend && obj && obj.get(this.dateattrend) && obj.get(this.dateattrend) != this.rangeend)
            {
                this.rangeend = obj.get(this.dateattrend);
                $(this.selector).datepicker('setEndDate', new Date(obj.get(this.dateattrend)));
            }
            this._getValidDates();
            this._clearValidations();
        }
        ,
        _getValidDates: function ()
        {
            logger.debug(this.id + '._getResourcesFromXPath');
            // retrieve only resources connected to scheduleditems.
            // get resource from Schedule_ScheduledItem/ScheduledItem
            if (this.validdateentity)
            {
                var validDateEntityName = this.validdateentity.split('/')[1];
                var dateReference = this.validdateentity.split('/')[0];

                if (this._contextObj)
                {
                    var xpath = "//" + validDateEntityName + "[" + dateReference + "='" + this._contextObj.getGuid() + "']";
                    mx.data.get({
                        xpath: xpath,
                        filter: this.resfilter,
                        callback: dojo.hitch(this, this._receivedDates)
                    });
                } else
                {
                    logger.warn(this.id + "._getValidDates -- Warning: No context object available.");
                }
            }
        }
        ,
        _receivedDates: function (objs)
        {
            var i;
            logger.debug(objs.length + ' Valid dates received!');
            this.validDates = [];
            for (i = 0; i < objs.length; i++)
            {
                this.validDates.push(new Date(objs[i].get(this.validdateattr)));
            }
            $(this.selector).datepicker("update");
        }
        ,
        beforeShowDay: function (d)
        {
            var i;
            if (this.validDates)
            {
                //console.log('before show ' + d);
                for (i = 0; i < this.validDates.length; i++)
                {
                    if (this.dateWithoutTimeSame(this.validDates[i], d))
                    {
                        //console.log('date found', d);
                        return {
                            classes: this.validdateclass
                        };
                    }
                }
            }
        }
        ,
        enable: function ()
        {
            console.log('enable ' + this.id);
            if (!this.readonly)
            {
                this.enabled = true;
                $(this.selector).removeAttr("readonly");
                $(this.selector).add("readonly");
                domClass.remove(this.domNode, "btdatepicker-disabled");
            }
        }
        ,

        disable: function ()
        {
            console.log('disable ' + this.id);
            this.enabled = false;
            $(this.selector).attr("readonly", "true");
            domClass.add(this.domNode, "btdatepicker-disabled");
        }
        ,

        _setDisabledAttr: function (value)
        {
            if (value)
            {
                this.disable();
            } else
            {
                this.enable();
            }
        }
        ,

        uninitialize: function ()
        {
        }
        ,

        _handleValidation: function (validations)
        {
            this._clearValidations();

            var val = validations[0];
            var msg = val.getReasonByAttribute(this.dateattr);

            if (this.readOnly)
            {
                val.removeAttribute(this.dateattr);
            } else
            {
                if (msg)
                {
                    this._addValidation(msg);
                    val.removeAttribute(this.dateattr);
                }
            }
        }
        ,

        _clearValidations: function ()
        {
            domConstruct.destroy(this._alertdiv);
        }
        ,

        _addValidation: function (msg)
        {
            this._alertdiv = domConstruct.create("div", {
                'class': 'alert alert-danger',
                innerHTML: msg
            });

            this.domNode.appendChild(this._alertdiv);
        }
        ,

        resetSubscriptions: function ()
        {
            var objHandle = null,
                attrHandle = null,
                attrHandleTo = null,
                validationHandle = null,
                attrHandle2 = null,
                attrHandleStart = null,
                attrHandleEnd = null;

            // Release handles on previous object, if any.
            //if(this._handles){
            //	this._handles.forEach(function (handle, i) {
            //		mx.data.unsubscribe(handle);
            //	});
            //}
            this.unsubscribeAll();

            if (this._contextObj)
            {
                objHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function (guid)
                    {
                        this._updateRendering();
                    })
                });
                attrHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.dateattr,
                    callback: lang.hitch(this, function (guid, attr, attrValue)
                    {
                        logger.debug('update attr', new Date(attrValue), this.id, this.selector);
                        var newdate1 = new Date(attrValue);
                        if (!this.dateWithoutTimeSame(newdate1, this.date1))
                        {
                            //console.debug('selector 2', this.selector, newdate1);
                            if (this.date2)
                            {
                                $(this.selector).datepicker('setDates', [newdate1, this.date2]);
                            } else
                            {
                                $(this.selector).datepicker('setDate', newdate1);
                            }
                            this.date1 = newdate1;
                        }
                    })
                });
                if (this.dateattrto)
                {
                    attrHandleTo = this.subscribe({
                        guid: this._contextObj.getGuid(),
                        attr: this.dateattrto,
                        callback: lang.hitch(this, function (guid, attr, attrValue)
                        {
                            //$(this.selector).find('#endTime').datepicker('update', new Date(attrValue));
                            this.date2 = new Date(attrValue);
                            $(this.selector).datepicker('setDate', [this.date1, this.date2]);

                            logger.debug('update attr', attr, attrValue);
                            //this._updateRendering();
                        })
                    });
                }
                if (this.dateattrstart)
                {
                    attrHandleStart = this.subscribe({
                        guid: this._contextObj.getGuid(),
                        attr: this.dateattrstart,
                        callback: lang.hitch(this, function (guid, attr, attrValue)
                        {
                            $(this.selector).datepicker('setStartDate', attrValue ? new Date(attrValue) : false);
                            logger.debug('update start date ', attr, attrValue);
                        })
                    });
                }
                if (this.dateattrend)
                {
                    attrHandleEnd = this.subscribe({
                        guid: this._contextObj.getGuid(),
                        attr: this.dateattrend,
                        callback: lang.hitch(this, function (guid, attr, attrValue)
                        {
                            $(this.selector).datepicker('setEndDate', attrValue ? new Date(attrValue) : false);
                            logger.debug('update end date', attr, attrValue);
                        })
                    });
                }

                if (this.editableattr)
                {
                    attrHandle2 = this.subscribe({
                        guid: this._contextObj.getGuid(),
                        attr: this.editableattr,
                        callback: lang.hitch(this, function (guid, attr, attrValue)
                        {
                            if (attrValue)
                            {
                                this.enable();
                            } else
                            {
                                this.disable();
                            }
                        })
                    });
                }

                validationHandle = mx.data.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: lang.hitch(this, this._handleValidation)
                });

                //this._handles = [objHandle, attrHandle, validationHandle, attrHandle2, attrHandleTo, attrHandleStart, attrHandleEnd];
            }
        }
        ,
        dateWithoutTimeSame: function (date1, date2)
        {
            if (date1 === null || date2 === null)
            {
                return (date1 == date2);
            }
            var d1 = new Date(date1);
            var d2 = new Date(date2);
            d1.setHours(0, 0, 0, 0);
            d2.setHours(0, 0, 0, 0);
            return d1.getTime() === d2.getTime();
        }
        ,
        loadTranslations: function ()
        {
            // copy paste content from the locale file you want to extend
            $.fn.datepicker.dates.nl = {
                days: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"],
                daysShort: ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"],
                daysMin: ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"],
                months: ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"],
                monthsShort: ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"],
                today: "Vandaag",
                clear: "Wissen",
                weekStart: 1,
                format: "dd-mm-yyyy"
            };
            $.fn.datepicker.dates.de = {
                days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
                daysShort: ["Son", "Mon", "Die", "Mit", "Don", "Fre", "Sam", "Son"],
                daysMin: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
                months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
                monthsShort: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
                today: "Heute",
                clear: "Löschen",
                weekStart: 1,
                format: "dd.mm.yyyy"
            };
            $.fn.datepicker.dates['en-GB'] = {
                days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
                months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                today: "Today",
                clear: "Clear",
                weekStart: 1,
                format: "dd/mm/yyyy"
            };
            $.fn.datepicker.dates.gl = {
                days: ["Domingo", "Luns", "Martes", "Mércores", "Xoves", "Venres", "Sábado", "Domingo"],
                daysShort: ["Dom", "Lun", "Mar", "Mér", "Xov", "Ven", "Sáb", "Dom"],
                daysMin: ["Do", "Lu", "Ma", "Me", "Xo", "Ve", "Sa", "Do"],
                months: ["Xaneiro", "Febreiro", "Marzo", "Abril", "Maio", "Xuño", "Xullo", "Agosto", "Setembro", "Outubro", "Novembro", "Decembro"],
                monthsShort: ["Xan", "Feb", "Mar", "Abr", "Mai", "Xun", "Xul", "Ago", "Sep", "Out", "Nov", "Dec"],
                today: "Hoxe",
                clear: "Limpar",
                weekStart: 1,
                format: "dd/mm/yyyy"
            };

            $.fn.datepicker.dates.es = {
                days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
                daysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
                daysMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
                months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
                monthsShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
                today: "Hoy",
                clear: "Borrar",
                weekStart: 1,
                format: "dd/mm/yyyy"
            };
            $.fn.datepicker.dates.fr = {
                days: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
                daysShort: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
                daysMin: ["D", "L", "Ma", "Me", "J", "V", "S", "D"],
                months: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
                monthsShort: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jui", "Jul", "Aou", "Sep", "Oct", "Nov", "Déc"],
                today: "Aujourd'hui",
                clear: "Effacer",
                weekStart: 1,
                format: "dd/mm/yyyy"
            };
        }

    });
});

require(["BootstrapDatepicker/widget/BootstrapDatepicker"], function ()
{
    "use strict";
    return;
});
