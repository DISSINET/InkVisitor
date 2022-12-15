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
  StyledModalAcknowledgementLogo,
  StyledModalContent,
  StyledModalContentWrapper,
  StyledModalHeader,
  StyledModalLink,
  StyledModalLogo,
  StyledModalText,
  StyledModalTextListItem,
  StyledModalTextList,
} from "./AboutStyles";

import LogoInkvisitor from "assets/logos/inkvisitor-full.svg";
import { AiOutlineLink } from "react-icons/ai";
import { HiLink } from "react-icons/hi";
import { FaUserAlt } from "react-icons/fa";
import { MdMail } from "react-icons/md";
const LogoGACR = require("assets/logos/gacr-en_rgb.png");
const LogoERC = require("assets/logos/logo_erc-flag_eum.png");
const LogoMUNI = require("assets/logos/arts-muni.png");

interface IAcknowledgementLogo {
  src: string;
  url: string;

}
const AcknowledgementLogo: React.FC<IAcknowledgementLogo> = ({ src, url }) => {
  return (
    <a href={url} target="_blank" rel="">
      <StyledModalAcknowledgementLogo height={100}
        src={src} />
    </a>
  )
}

interface IMailWithIcon {
  label: string;
  url: string;
}
const IMailWithIcon: React.FC<ILinkWithIcon> = ({ label, url }) => {
  return (
    <StyledModalLink>
      <a href={`mailto: ${url}`}>
        <MdMail></MdMail>=
        {label}
      </a>
    </StyledModalLink>
  );
};
interface ILinkWithIcon {
  label: string;
  url: string;
}

const LinkWithIcon: React.FC<ILinkWithIcon> = ({ label, url }) => {
  return (
    <StyledModalLink>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <HiLink></HiLink>
        {label}
      </a>
    </StyledModalLink>
  );
};

interface IPersonWithIcon {
  label: string;
  url: string;
}

const PersonWithIcon: React.FC<IPersonWithIcon> = ({ label, url }) => {
  return (
    <StyledModalLink>
      <a href={url}>
        <FaUserAlt></FaUserAlt>
        {label}
      </a>
    </StyledModalLink>
  );
};
interface IAboutPage {
}

export const AboutPage: React.FC<IAboutPage> = ({ }) => {
  return (
    <div style={{ margin: "auto" }}>
      <ModalContent>
        <StyledModalContentWrapper>
          <StyledModalLogo>
            <img width={"100%"} src={LogoInkvisitor} />
          </StyledModalLogo>

          <StyledModalContent>
            <StyledModalHeader>About</StyledModalHeader>
            <StyledModalText>
              <StyledModalTextList>

                <StyledModalTextListItem>
                  InkVisitor is an <b>open-source, browser-based research environment for linked data</b>. It is designed to assist researchers in the humanities and social sciences in <b>transforming texts into complex structured data for further exploration and analysis.</b>
                </StyledModalTextListItem>
                <StyledModalTextListItem>
                  InkVisitor implements a specific method of text-oriented data collection: <b>Computer-Assisted Semantic Text Modelling (CASTEMO)</b>. CASTEMO is <b>highly attentive to semantic detail and the qualities of original expression.</b>
                </StyledModalTextListItem>
                <StyledModalTextListItem>
                  The data are entered in the form of <b>entities</b> and <b>statements</b>. Statements relate entities of various types into <b>semantic quadruples</b> (subject, verb, object 1, object 2) following the syntactic structure of texts.
                </StyledModalTextListItem>
                <StyledModalTextListItem>
                  InkVisitor serves as a data-entry front-end for JSON-format <b>research databases</b> (<LinkWithIcon label="RethinkDB" url="https://rethinkdb.com" />). These databases allow for complex queries and render the data available for various kinds of computational analyses.
                </StyledModalTextListItem>
                <StyledModalTextListItem>
                  InkVisitor has been developed by the <b>ERC-funded Dissident Networks Project</b> (<LinkWithIcon url="https://dissinet.cz" label="DISSINET" />).
                </StyledModalTextListItem>
                <StyledModalTextListItem>
                  InkVisitor is distributed under an <b>open license</b> (the <LinkWithIcon url="https://opensource.org/licenses/BSD-3-Clause" label="BSD 3-Clause License" />).
                </StyledModalTextListItem>
                <StyledModalTextListItem>
                  Please post feature requests and report bugs on our  <LinkWithIcon url="https://github.com/DISSINET/InkVisitor/issues" label="GitHub" />.
                </StyledModalTextListItem>

              </StyledModalTextList>


              {/* <IMailWithIcon
                url="david.zbiral@post.cz"
                label="email adress of the projects PI"
              /> */}
            </StyledModalText>

            <StyledModalHeader>Credits</StyledModalHeader>

            <StyledModalTextList>
              <StyledModalTextListItem>
                The <b>lead authors of the CASTEMO data collection workflow and data model</b> are <PersonWithIcon url="" label="David Zbíral" />, and <PersonWithIcon url="" label="Robert L. J. Shaw" />.
                Other authors include <PersonWithIcon url="" label="Tomáš Hampejs" /> and <PersonWithIcon url="" label="Adam Mertel" />.
              </StyledModalTextListItem>
              <StyledModalTextListItem>
                The <b>lead developer of InkVisitor</b> is <PersonWithIcon url="" label="Adam Mertel" />. Other developers include <PersonWithIcon url="" label="Petr Hanák" />, <PersonWithIcon url="" label="Ján Mertel" />, <PersonWithIcon url="" label="Peter Ondrejka" />, and others.
              </StyledModalTextListItem>
              <StyledModalTextListItem>
                <b>Testers</b> of InkVisitor and <b>contributors to specific parts of the data model</b> include <PersonWithIcon url="" label="Katia Riccardo" />, <PersonWithIcon url="" label="Davor Salihović" />, and others.
              </StyledModalTextListItem>
            </StyledModalTextList>

            <StyledModalHeader>Funding</StyledModalHeader>
            <StyledModalTextList>
              <StyledModalTextListItem>
                <b>European Research Council</b> (project No. 101000442 “Networks of Dissent: Computational Modelling of Dissident and Inquisitorial Cultures in Medieval Europe (DISSINET)”, 2021–2026)
              </StyledModalTextListItem>
              <StyledModalTextListItem>
                <b>Czech Science Foundation</b> (EXPRO project No. GX19-26975X “Dissident Religious Cultures in Medieval Europe from the Perspective of Social Network Analysis and Geographic Information Systems”, 2019–2021)
              </StyledModalTextListItem>
              <StyledModalTextListItem>
                <b>Masaryk University, Faculty of Arts</b> (project “InkVisitor Development: Towards a Project-Neutral Open-Source Research Application for the Collection of Structured Relational Data from Texts”, 2022–2023)
              </StyledModalTextListItem>
            </StyledModalTextList>


            <StyledModalHeader>Cite InkVisitor</StyledModalHeader>

            <StyledModalTextList>
              <StyledModalTextListItem>
                <StyledModalText>Zbíral, David; Mertel, Adam; Hanák, Petr; Mertel, Ján; Ondrejka, Peter; Hampejs, Tomáš; and Shaw, Robert L. J. (2022). InkVisitor. Available online at:<LinkWithIcon
                  url="https://github.com/DISSINET/InkVisitor"
                  label="https://github.com/DISSINET/InkVisitor"
                />.</StyledModalText>
              </StyledModalTextListItem>
            </StyledModalTextList>


            <StyledModalHeader>Cite CASTEMO</StyledModalHeader>

            <StyledModalTextList>
              <StyledModalTextListItem>
                <StyledModalText>Zbíral, David; Shaw, Robert L. J.; Hampejs, Tomáš; & Mertel, Adam. (2022). Model the source first! Towards Computer-Assisted Semantic Text Modelling and source criticism 2.0. Zenodo.<LinkWithIcon
                  url="https://doi.org/10.5281/zenodo.6963579"
                  label="https://doi.org/10.5281/zenodo.6963579"
                /></StyledModalText>
              </StyledModalTextListItem>
            </StyledModalTextList>
          </StyledModalContent>

          <StyledModalAcknowledgement>
            <AcknowledgementLogo
              src={LogoERC.default}
              url="https://erc.europa.eu/homepage"
            />
            <AcknowledgementLogo
              src={LogoGACR.default}
              url="https://gacr.cz/en/"
            />
            <AcknowledgementLogo
              src={LogoMUNI.default}
              url="https://www.phil.muni.cz/en"
            />
          </StyledModalAcknowledgement>
        </StyledModalContentWrapper>
      </ModalContent>
    </div >
  );
};
