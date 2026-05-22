import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | undefined;

if (!transporter) {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "nikeshkumartk2020@gmail.com",
      pass: "kelm uvxw fkkn wogu",
    },
  });
}

export const sendMail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  const result = await transporter!.sendMail({
    from: "nikeshkumartk2020@gmail.com",
    to,
    subject,
    html,
  });
  return result;
};
