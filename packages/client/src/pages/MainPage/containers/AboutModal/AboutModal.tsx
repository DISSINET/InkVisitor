import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import React from "react";
import {
  StyledModalAcknowledgement,
  StyledModalAcknowledgementHeader,
  StyledModalAcknowledgementLogo,
  StyledModalAcknowledgementText,
  StyledModalContentWrapper,
  StyledModalLogo,
  StyledModalText,
  StyledModalTextHeader,
  StyledModalTextLink,
  StyledModalTextSection,
  StyledModalTitle,
} from "./AboutModalStyles";

import LogoInkvisitor from "assets/logos/inkvisitor-full.svg";
import { AiOutlineLink } from "react-icons/ai";
import { HiLink } from "react-icons/hi";
import { FaUserAlt } from "react-icons/fa";
import { MdMail } from "react-icons/md";
const LogoGACR = require("assets/logos/gacr-en_rgb.png");
const LogoERC = require("assets/logos/logo_erc-flag_eum.png");

interface IMailWithIcon {
  label: string;
  url: string;
}

const IMailWithIcon: React.FC<ILinkWithIcon> = ({ label, url }) => {
  return (
    <StyledModalTextLink>
      <a href={`mailto: ${url}`}>
        <MdMail></MdMail>
        {label}
      </a>
    </StyledModalTextLink>
  );
};
interface ILinkWithIcon {
  label: string;
  url: string;
}

const LinkWithIcon: React.FC<ILinkWithIcon> = ({ label, url }) => {
  return (
    <StyledModalTextLink>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <HiLink></HiLink>
        {label}
      </a>
    </StyledModalTextLink>
  );
};

interface IPersonWithIcon {
  label: string;
  url: string;
}

const PersonWithIcon: React.FC<IPersonWithIcon> = ({ label, url }) => {
  return (
    <StyledModalTextLink>
      <a href={url}>
        <FaUserAlt></FaUserAlt>
        {label}
      </a>
    </StyledModalTextLink>
  );
};
interface AboutModal {
  isOpen: boolean;
  onCloseFn: Function;
}

export const AboutModal: React.FC<AboutModal> = ({ isOpen, onCloseFn }) => {
  return (
    <Modal showModal={isOpen} onClose={() => onCloseFn()} width={"fat"}>
      <ModalHeader title={"About"} />
      <ModalContent>
        <StyledModalContentWrapper>
          <StyledModalLogo>
            <img width={"100%"} src={LogoInkvisitor} />
          </StyledModalLogo>
          <StyledModalTitle>
            InkVisitor - a complex structured data collection
          </StyledModalTitle>
          <StyledModalText>
            <StyledModalTextHeader>About</StyledModalTextHeader>
            <StyledModalTextSection>
              The need for a tool allowing to collect various unstructer data
              for further analysis resolved from the
              <LinkWithIcon url="https://dissinet.cz" label="DISSINET" />{" "}
              project. You can read more about the motivation in this{" "}
              <LinkWithIcon
                label="blogpost"
                url="https://dissinet.cz/news/articles/model-the-source-first-towards-source-modelling-and-source-criticism-20"
              />
              . The application is developed as an open source, the code is
              located on our
              <LinkWithIcon
                url="https://github.com/DISSINET/InkVisitor"
                label="GitHub repository"
              />
              . In case you have any question or you want to contact us
              regarding any cooperation, use the
              <IMailWithIcon
                url="david.zbiral@post.cz"
                label="email adress of the projects PI"
              />
              .
            </StyledModalTextSection>

            <StyledModalTextHeader>Credits</StyledModalTextHeader>
            <StyledModalTextSection>
              The data collection workflow was designed by
              <PersonWithIcon url="" label="David Zbíral" />,{" "}
              <PersonWithIcon url="" label="Robert L.J. Shaw" />,{" "}
              <PersonWithIcon url="" label="Tomáš Hampejs" />, and{" "}
              <PersonWithIcon url="" label="Adam Mertel" />. The InkVisitor
              developer team consists of{" "}
              <PersonWithIcon url="" label="Adam Mertel" />,{" "}
              <PersonWithIcon url="" label="Petr Hanák" />,{" "}
              <PersonWithIcon url="" label="Ján Mertel" />, and{" "}
              <PersonWithIcon url="" label="Peter Ondrejka" />.
            </StyledModalTextSection>
          </StyledModalText>

          <StyledModalAcknowledgement>
            <StyledModalAcknowledgementHeader>
              Acknowledgement of support
            </StyledModalAcknowledgementHeader>
            <StyledModalAcknowledgementText>
              The development of the InkVisitor was supported by the European
              Research Council and Czech Science Foundation.
            </StyledModalAcknowledgementText>
            <StyledModalAcknowledgementLogo
              height={100}
              src={LogoERC.default}
            />
            <StyledModalAcknowledgementLogo
              height={90}
              src={LogoGACR.default}
            />
          </StyledModalAcknowledgement>
        </StyledModalContentWrapper>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button
            key="close"
            label="Close"
            color="primary"
            inverted
            onClick={() => onCloseFn()}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
