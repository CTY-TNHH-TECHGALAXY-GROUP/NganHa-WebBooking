# CORRECTED: 10 customer flow tests

Correction to the previous QA report: CF08 returned HTTP 200 and actually created booking WB-08092099-53UPD855, status NEW, for 08:30 on 2099-09-08. The earlier statement that no booking was created was incorrect. This QA booking has not been deleted or changed.

Results: 6 PASS, 3 FAIL, 1 BLOCKED. These are live HTTP/API checks, not a complete browser E2E acceptance. CF06 confirms HTTP availability of five locale pages, not full translation quality.

## CF01 Catalog: active services and original DB prices

PASS

{
  "count": 80,
  "serviceId": "NHS0008",
  "priceVND": 580000,
  "priceUSD": 24
}

## CF02 Single service: signed quote matches catalog VND/USD

FAIL

"The expression evaluated to a falsy value:\n\n  assert.ok(r.data.quote)\n"

## CF03 Quantity 1 to 2: total doubles without changing unit price

PASS

{
  "quantity": 2,
  "totalVND": 1160000
}

## CF04 Multiple durations: selected lines remain separate

PASS

{
  "services": [
    {
      "id": "NHS0008",
      "duration": 60
    },
    {
      "id": "NHS0009",
      "duration": 70
    }
  ]
}

## CF05 Private room add-on: correct DB add-on charge

PASS

{
  "addonId": "NHS0900",
  "totalVND": 685000
}

## CF06 Five language checkout pages load

PASS

{
  "pages": [
    {
      "lang": "vi",
      "status": 200
    },
    {
      "lang": "en",
      "status": 200
    },
    {
      "lang": "jp",
      "status": 200
    },
    {
      "lang": "kr",
      "status": 200
    },
    {
      "lang": "cn",
      "status": 200
    }
  ],
  "limitation": "HTTP rendering only; not proof of complete translations or browser interactions."
}

## CF07 Reject missing name, invalid phone and invalid email

PASS

{
  "status": 400,
  "limitation": "Combined invalid contact payload rejected; individual fields not independently tested."
}

## CF08 Reject out-of-hours and past booking slots

FAIL

{
  "status": 200,
  "expectedStatus": 400,
  "testedSlot": "2099-09-08 08:30",
  "unexpectedBookingCreated": true,
  "bookingId": "WB-08092099-53UPD855",
  "bookingStatus": "NEW",
  "verifiedBy": "Read-back of QA time validation / nghik22@gmail.com in configured DB",
  "remainingSlots": "NOT RUN: stopped immediately at first failed assertion",
  "confirmationEmail": "Not independently verified; check recipient inbox"
}

## CF09 Reject invalid quantity and recover forged cart prices

FAIL

{
  "testedQuantity": 0,
  "status": 200,
  "expectedStatus": 400,
  "remainingChecks": "NOT RUN: negative/fractional/excess quantity and tampered price checks stopped after quantity zero failed"
}

## CF10 Booking persistence and confirmation email readiness

BLOCKED

{
  "atomicRpc": false,
  "hasKey": false,
  "hasFingerprint": false,
  "bookingCreated": "No separate CF10 booking; CF08 unexpectedly created a NEW booking",
  "bookingEmailSent": false,
  "limitation": "Local configured DB metadata; production env identity not independently verified.",
  "reason": "Local source dependencies absent in DB. Valid booking flow and idempotency not verified. Legacy live endpoint DID create the invalid-slot QA booking in CF08."
}

Catalog prices and shared schema were not changed. Booking confirmation email receipt is not verified. This message is the corrected test report.
