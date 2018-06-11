# BootstrapDatepicker
Mendix Bootstrap Datepicker
Description

### Description  

Feature rich datepicker based on

http://eternicode.github.io/bootstrap-datepicker  

### Typical usage scenario

Date picker is cases where more options are required.

### Features and limitations

1.  Optionally starts when entering the field, typing a date is also possible
2.  Optionally inline (always show calendar)
3.  First day of the week option
4.  Show week number option
5.  Option to make days of the week not selectable
6.  Version for a date range to enter two dates
7.  Optional autoclose
8.  Optional highlight today
9.  Add a time (default 12:00) to the date
10.  Limit the date relative to current date. e.g. +/- 3 months.
11.  English, German, French and Dutch languages.
12.  Optional startview to start on year or month level

### Installation

Download from App Store

### Configuration

Connect to the date attribute(s), select the options.

**Type:**

*   Text input: show just an input, display the date picker when tabbing/entering the field
*   Component: Adds a button to show the datepicker
*   Embedded: Show the datepicker in the form. Not as popup
*   Range: show two date (don't forget to connect two attributes)  
    

**Week starts**: By default it starts on sunday (0). Change it to 1 of monday  

**Today button**: Show a button to move to today  

**Show clear button**: Show a button to clear the entered date.

**Highlight today**: Today is colored

**Show weeknumbers**: extra first columns with weeknumbers

**Disabled days**: Comma separated list. If provided these dates can not be selected (0,6 will disable sundays and saturdays)

**Auto close:** If a date is selected the date picker form is closed.

**Default time**: if a date is selected the time part is set to this.

**Limit start date**: -3d will limit the selectable days starting from 3 days ago. w=weeks, m=months, y=years. Leave empty if not applicable.

**Limit end date**: Same as start date but use a combination for a feasable date.

**Text between dates**: If the type is 'range' is displayed between the two dates. If omitted it will be 'to'.

  

### Known bugs

  

-

### Frequently Asked Questions

*   **Q: What if I don't connect a second date attribute with type range?**  
    
*   **A: It will be displayed as a single date.**
