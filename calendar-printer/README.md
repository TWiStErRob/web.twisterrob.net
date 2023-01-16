Today's dev: http://google.twisterrob.net/calendar.html

Google Calendar's print feature didn't make the cut, so I made a different one.

Features:
 * public calendar of choice
 * date range setting
 * bookmarkable url
 * compact layout
 * printable
 * supports whole day/multi-day events
 * url without date it shows next 3 weeks
 * partial localization (&lang=, not fully supported yet)
(Hmm, akár kötproginak is elmenne...)

Examples/Példák
 * Moon: http://google.twisterrob.net/calendar.html#!&calendar=ht3jlfaac5lfd6263ulfh4tql8%40group.calendar.google.com
 * Ünnepek: http://google.twisterrob.net/calendar.html#!&calendar=hu.hungarian%23holiday%40group.v.calendar.google.com&from=2013-01-01&to=2013-12-31&timeZone=%2B01%3A00
 * Holidays: http://google.twisterrob.net/calendar.html#!&calendar=en.uk%23holiday%40group.v.calendar.google.com
 * Névnapok: http://google.twisterrob.net/calendar.html#!&calendar=hu.hungarian_namedays%23holiday%40group.v.calendar.google.com
 * Szeged Nap: http://google.twisterrob.net/calendar.html#!&calendar=i_91.120.28.2%23sunrise%40group.v.calendar.google.com
 * London Sun: http://google.twisterrob.net/calendar.html#!&calendar=i_109.68.196.188%23sunrise%40group.v.calendar.google.com
 * Google Dev calendar: http://google.twisterrob.net/calendar.html#!&calendar=developer-calendar%40google.com&from=2013-01-01&to=2014-01-01&timeZone=%2B00%3A00&lang=en
 * Days (boring): http://google.twisterrob.net/calendar.html#!&calendar=%23daynum%40group.v.calendar.google.com

Used:
 * https://developers.google.com/gdata/javadoc/com/google/gdata/data/calendar/CalendarEntry
 * http://momentjs.com/docs/#/manipulating/start-of/
 * http://documentcloud.github.com/underscore/#sortBy
 * https://developers.google.com/google-apps/calendar/v2/reference

Next:
 * auth
 * valid http://ajax.aspnetcdn.com/ajax/jQuery.Validate/1.6/jQuery.Validate.pack.js
