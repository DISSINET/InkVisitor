import React from "react";
import { StyledContactAdmin } from "./ContactAdminFootingStyles";

interface ContactAdminFooting {}
export const ContactAdminFooting: React.FC<ContactAdminFooting> = ({}) => {
  const adminMail = process.env.ADMIN_MAIL || "<fill admin mail in env>";
  return (
    <StyledContactAdmin>
      {`In case of any problems, please contact the administrator at ${adminMail}`}
    </StyledContactAdmin>
  );
};
