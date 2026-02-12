import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API);

const sendEmail = async ({ to, subject, body }) => {
  try {
    const response = await resend.emails.send({
      from: "ShowMama <onboarding@resend.dev>", // default free sender
      to,
      subject,
      html: body,
    });

    console.log("Email sent:", response);
    return response;
  } catch (error) {
    console.error("Resend error:", error);
    throw error;
  }
};

export default sendEmail;
