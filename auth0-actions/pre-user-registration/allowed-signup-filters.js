/**
 * Handler that will be called during the execution of a PreUserRegistration flow.
 *
 * @param {Event} event - Details about the context and user that is attempting to register.
 * @param {PreUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the signup.
 */
exports.onExecutePreUserRegistration = async (event, api) => {
  const allowedEmails = JSON.parse(event.secrets.allowedEmails).map(
    (/** @type {string} */ email) => email.toLowerCase(),
  );

  console.log({ allowedEmails });

  const email = event.user.email?.toLowerCase();

  if (!email || !allowedEmails.includes(email)) {
    api.access.deny(
      `Unauthorized signup: email not on invite list -> ${email}`,
      "The email entered was not on the approved email list for signups. Please contact us for approval to signup as a beta tester.",
    );
  }
};
