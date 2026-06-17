export const DEFAULT_CONTACT_EMAIL = "Santa@northstarsanta.com";

export const fromEmail = () =>
  process.env.EMAIL_FROM || process.env.FROM_EMAIL || DEFAULT_CONTACT_EMAIL;

export const getNotificationEmail = async (client) => {
  try {
    const settings = await client.fetch(
      `*[_type == "siteSettings" && !(_id in path("drafts.**"))][0]{ contactEmail }`,
    );
    const contactEmail = settings?.contactEmail?.trim();
    if (contactEmail) return contactEmail;
  } catch (error) {
    console.error("Could not load site contact email from Sanity:", error);
  }

  return (
    process.env.CONTACT_EMAIL ||
    process.env.BOOKING_NOTIFICATION_EMAIL ||
    DEFAULT_CONTACT_EMAIL
  );
};

export const siteFooterContact = (email) => `North Star Santa · ${email || DEFAULT_CONTACT_EMAIL}`;
