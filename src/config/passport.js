const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../entities/User');

// Only configure the Google OAuth2 strategy when credentials are provided.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            // If someone already registered with this email via password,
            // link the Google account to that existing user instead of
            // creating a duplicate.
            const email = profile.emails?.[0]?.value;
            user = email ? await User.findOne({ email }) : null;

            if (user) {
              user.googleId = profile.id;
              await user.save({ validateBeforeSave: false });
            } else {
              user = await User.create({
                name: profile.displayName,
                email,
                // Google doesn't provide a phone number — use a unique placeholder.
                // The user should be prompted to add a real phone number from their profile.
                phone: `google_${profile.id}`,
                googleId: profile.id,
                avatarUrl: profile.photos?.[0]?.value || null,
                isVerified: true, // Google has already verified this email
              });
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  // eslint-disable-next-line no-console
  console.warn('Google OAuth configuration missing: skipping GoogleStrategy setup');
}

// No sessions — we issue our own JWTs, so passport doesn't need to
// serialize/deserialize a session user.
module.exports = passport;
