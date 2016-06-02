// BEGIN CODE BootstrapCalendar.widget.BootstrapCalendar
/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console */
/*mendix */
/*
    BootstrapCalendar
    ========================

    @file      : BootstrapCalendar.js
    @version   : 1
    @author    : Chris de Gelder
    @date      : 1-3-2025
    @copyright : Chris de Gelder
    @license   : Apache 2
	based on http://eternicode.github.io/bootstrap-datepicker
*/
mxui.dom.addCss(dojo.moduleUrl("BootstrapCalendar", "css/datepicker.css"));
mxui.dom.addCss(dojo.moduleUrl("BootstrapCalendar", "css/datepicker3.css"));
// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
require({
    packages: [{ name: 'jquery', location: '../../widgets/BootstrapCalendar/lib', main: 'jquery-1.11.2.min' },
	           { name: 'btdatepicker', location: '../../widgets/BootstrapCalendar/lib', main: 'bootstrap-datepicker' },
	           { name: 'dpengb', location: '../../widgets/BootstrapCalendar/lib/locales', main: 'bootstrap-datepicker.en-GB' },
	           { name: 'dpnl', location: '../../widgets/BootstrapCalendar/lib/locales', main: 'bootstrap-datepicker.nl' },
	           { name: 'dpde', location: '../../widgets/BootstrapCalendar/lib/locales', main: 'bootstrap-datepicker.de' },
	           { name: 'dpfr', location: '../../widgets/BootstrapCalendar/lib/locales', main: 'bootstrap-datepicker.fr' }
			   ]
}, [
    'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_TemplatedMixin',
    'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/_base/array', 'dojo/_base/lang', 'dojo/text',
    'jquery', 'dojo/text!BootstrapCalendar/widget/template/BootstrapCalendar.html', 'btdatepicker', 'dpengb', 'dpde', 'dpfr', 'dpnl', 'dpde'
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, domQuery, domProp, domGeom, domClass, domStyle, domConstruct, dojoArray, lang, text, $, widgetTemplate, btdatepicker, dpengb, dpfr, dpnl, dpde) {
    'use strict';
    
    // Declare widget's prototype.
    return declare('BootstrapCalendar.widget.BootstrapCalendar', [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handle: null,
        _contextObj: null,
        _objProperty: null,
		selector: '',
		enabled: true,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            this._objProperty = {};
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
			var id = this.id + "_cal";
            var div = dom.create('div' , { 'id' : id } );
			this.domNode.appendChild(div);
			this.selector = '#' + id + ' input';
			if (this.displaytype=="range" && (this.dateattrto==null || this.dateattrto==undefined || this.dateattr==this.dateattrto)) {
				this.displaytype = "textinput";
				console.log("range without second date attribute provided: fallback to text input");
			}
			switch (this.displaytype) { 
				case "textinput": 
					this.selector = '#' + id + ' input';
					div.appendChild(dom.create('input', { 'class': 'form-control', 'type': 'text' }));
					break;
				case "component": 
					this.selector = '#' + id + ' .input-group.date';
					var groupdiv = div.appendChild(dom.create('div', { 'class': 'input-group date' }));
					groupdiv.appendChild(dom.create('input', { 'class': 'form-control', 'type': 'text' }));
					var span = dom.create('span', { 'class': 'input-group-addon' });
					groupdiv.appendChild(span);
					span.appendChild(dom.create('i', { 'class': 'glyphicon glyphicon-th' }));					
					break;
				case "embedded": 
					this.selector = '#' + id + ' .embedded';
					div.appendChild(dom.create('div', { 'class': 'embedded' }));
					break;
				case "range": 
					this.selector = '#' + id + ' .input-daterange';
					var rangediv = div.appendChild(dom.create('div', { 'class': 'input-daterange input-group', 'id' : 'datepicker' }));
					rangediv.appendChild(dom.create('input', { 'class': 'input-sm form-control', 'type': 'text', 'name': 'start', 'id': 'startTime' }));
					rangediv.appendChild(dom.create('span', { 'class': 'input-group-addon' }, this.totext||"To"));
					rangediv.appendChild(dom.create('input', { 'class': 'input-sm form-control', 'type': 'text', 'name': 'end', 'id' : 'endTime' }));
					break;
			}
			//console.log('render', this.selector, $(this.selector));
			$(this.selector).datepicker({
				language: mx.ui.getLocale(),
				calendarWeeks: this.calendarweeks,
				weekStart: this.weekstart,
				todayBtn: this.todaybutton,
				clearBtn: this.clearbutton,
				autoclose: this.autoclose,
				daysOfWeekDisabled: this.daysofweekdisabled,
				todayHighlight: this.todayhighlight,
				onRender: function() { return this.enabled }
			})     
			.on('changeDate', dojo.hitch(this, this.dateChanged));
        },
		
		dateChanged: function (ev) {
			if (this._contextObj && ev.type=="changeDate" && ev.date) {
				ev.date.setHours(this.defaulthours);
				// second field for range?
				if(ev.target.attributes["name"].nodeValue=="end" && this.dateattrto) {
					this._contextObj.set(this.dateattrto, ev.date);
				} else {
					this._contextObj.set(this.dateattr, ev.date);
				}
				//console.log('date changed', ev);
				this.callmf();
			}
		},
		
		callmf: function () {
			mx.data.action({
				params: {
					applyto: 'selection',
					actionname: this.mfToExecute,
					guids: [this._contextObj.getGuid()]
				},
				callback: function (obj) {
					//TODO what to do when all is ok!
				},
				error: function (error) {
					console.log(this.id + ': An error occurred while executing microflow: ' + error.description);
				}
			}, this);		
		},

        update: function (obj, callback) {
            console.log(this.id + '.update', obj.get(this.dateattr), new Date(obj.get(this.dateattr)));
			if (this.displaytype=="range") {
				// undocumented feature to set start end: https://groups.google.com/forum/#!msg/bootstrap-datepicker/9q5n35QCpgg/sznmzU7-yaYJ
				$(this.selector).find('#startTime').datepicker('update', new Date(obj.get(this.dateattr))); 
				$(this.selector).find('#endTime').datepicker('update', new Date(obj.get(this.dateattrto))); 
				$(this.selector).data('datepicker').updateDates();				
			} else {
				$(this.selector).datepicker('setDate', new Date(obj.get(this.dateattr)));
			}
            this._contextObj = obj;

            callback();
        },

        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function () {
			this.enabled = true;
        },

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function () {
			this.enabled = false;
        },

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        resize: function (box) {

        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
        },

 
    });
});

// END CODE BootstrapCalendar.widget.BootstrapCalendar