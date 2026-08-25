# TODO — Password reset OTP + secure hashing + booking ratings

## Backend
- [ ] Add Redis dependency/config and OTP helpers.
- [ ] Replace SHA256 password hashing with bcrypt (hash + verify).
- [ ] Add forgot-password flow endpoints:
  - [ ] POST /api/auth/password/forgot (email -> OTP stored + sent to BOTH email and phone destinations linked to the account)
  - [ ] POST /api/auth/password/reset (email, otp, newPassword -> verify OTP in Redis + update password)
- [x] Upgrade rating enforcement:
  - [x] Ensure review can be created only if booking.status == 'completed'
  - [x] Ensure only one review per booking (DB uniqueness or pre-check)


## Client
- [x] Extend `client/src/lib/api.ts` with forgot/reset endpoints.
- [x] Update `client/src/pages/Login.tsx`:
  - [x] Add “Forgot password?” entry point
  - [x] Forgot flow UI (email -> OTP -> new password -> confirm)
- [x] Ensure “Leave Review” CTA appears only when booking is completed and no review exists.



## Verification
- [ ] Run backend and manually test:
  - [ ] register/login works with bcrypt
  - [ ] forgot/reset OTP works (wrong OTP, expired OTP)
- [ ] Run frontend and manually test rating:
  - [ ] after marking booking completed, user can rate once, second attempt blocked.

