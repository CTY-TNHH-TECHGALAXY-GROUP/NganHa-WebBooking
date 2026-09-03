with open('src/styles/floating-widgets.css', 'r') as f:
    c = f.read()

c = c.replace(
'''/* ❌ HIDE WHEN BOOKING BASKET IS ACTIVE (MOBILE) */
body.has-floating-basket .floating-widgets,
body.has-booking-modal .floating-widgets {
  display: none !important;
}''',
'''/* ❌ HIDE WHEN BOOKING BASKET IS ACTIVE (MOBILE) */
body.has-floating-basket .floating-widgets,
body.has-booking-modal .floating-widgets,
body.has-booking-modal .google-review-widget {
  display: none !important;
}'''
)

with open('src/styles/floating-widgets.css', 'w') as f:
    f.write(c)

