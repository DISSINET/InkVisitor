import React from "react";
import {
  StyledAcknowledgement,
  StyledAcknowledgementLogo,
  StyledContent,
  StyledContentWrapper,
  StyledHeader,
  StyledLink,
  StyledLogo,
  StyledTextList,
  StyledTextListItem,
} from "./AboutPageStyles";

import LogoInkvisitor from "assets/logos/inkvisitor-full.svg";
import { FaUserAlt } from "react-icons/fa";
import { HiLink } from "react-icons/hi";
import { MdMail } from "react-icons/md";
const LogoGACR = require("assets/logos/gacr-en_rgb.png");
const LogoERC = require("assets/logos/logo_erc-flag_eum.png");
const LogoMUNI = require("assets/logos/arts-muni.png");
const LogoEUMSMT = require("assets/logos/eu_msmt.png");

interface IAcknowledgementLogo {
  src: string;
  url: string;
}
const AcknowledgementLogo: React.FC<IAcknowledgementLogo> = ({ src, url }) => {
  return (
    <a href={url} target="_blank" rel="">
      <StyledAcknowledgementLogo height={100} src={src} />
    </a>
  );
};

interface IMailWithIcon {
  label: string;
  url: string;
}
const IMailWithIcon: React.FC<ILinkWithIcon> = ({ label, url }) => {
  return (
    <StyledLink>
      <a href={`mailto: ${url}`}>
        <MdMail></MdMail>={label}
      </a>
    </StyledLink>
  );
};
interface ILinkWithIcon {
  label: string;
  url: string;
}

const LinkWithIcon: React.FC<ILinkWithIcon> = ({ label, url }) => {
  return (
    <StyledLink>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <HiLink></HiLink>
        {label}
      </a>
    </StyledLink>
  );
};

interface IPersonWithIcon {
  label: string;
  url: string;
}

const PersonWithIcon: React.FC<IPersonWithIcon> = ({ label, url }) => {
  return (
    <StyledLink>
      <a href={url}>
        <FaUserAlt></FaUserAlt>
        {label}
      </a>
    </StyledLink>
  );
};
interface IAboutPage {}

export const AboutPage: React.FC<IAboutPage> = ({}) => {
  return (
    <StyledContentWrapper>
      <StyledContent>
        <StyledLogo>
          <img width={"100%"} src={LogoInkvisitor} />
        </StyledLogo>

        <div>
          <StyledHeader>About</StyledHeader>
          <StyledTextList>
            <StyledTextListItem>
              InkVisitor is an{" "}
              <b>
                open-source, browser-based research environment for linked data
              </b>
              . It is designed to assist researchers in the humanities and
              social sciences in{" "}
              <b>
                transforming texts into complex structured data for further
                exploration and analysis.
              </b>
            </StyledTextListItem>
            <StyledTextListItem>
              InkVisitor implements a specific method of text-oriented data
              collection:{" "}
              <b>Computer-Assisted Semantic Text Modelling (CASTEMO)</b>.
              CASTEMO is{" "}
              <b>
                highly attentive to semantic detail and the qualities of
                original expression.
              </b>
            </StyledTextListItem>
            <StyledTextListItem>
              The data are entered in the form of <b>entities</b> and{" "}
              <b>statements</b>. Statements relate entities of various types
              into <b>semantic quadruples</b> (subject, verb, object 1, object
              2) following the syntactic structure of texts.
            </StyledTextListItem>
            <StyledTextListItem>
              InkVisitor serves as a data-entry front-end for JSON-format{" "}
              <b>research databases</b> (
              <LinkWithIcon label="RethinkDB" url="https://rethinkdb.com" />
              ). These databases allow for complex queries and render the data
              available for various kinds of computational analyses.
            </StyledTextListItem>
            <StyledTextListItem>
              InkVisitor has been developed by the{" "}
              <b>ERC-funded Dissident Networks Project</b> (
              <LinkWithIcon url="https://dissinet.cz" label="DISSINET" />
              ).
            </StyledTextListItem>
            <StyledTextListItem>
              InkVisitor is distributed under an <b>open license</b> (the{" "}
              <LinkWithIcon
                url="https://opensource.org/licenses/BSD-3-Clause"
                label="BSD 3-Clause License"
              />
              ).
            </StyledTextListItem>
            <StyledTextListItem>
              Please post feature requests and report bugs on our{" "}
              <LinkWithIcon
                url="https://github.com/DISSINET/InkVisitor/issues"
                label="GitHub"
              />
              .
            </StyledTextListItem>
          </StyledTextList>

          {/* <IMailWithIcon
                    url="david.zbiral@post.cz"
                    label="email adress of the projects PI"
                  /> */}

          <StyledHeader>Credits</StyledHeader>

          <StyledTextList>
            <StyledTextListItem>
              The{" "}
              <b>
                lead authors of the CASTEMO data collection workflow and data
                model
              </b>{" "}
              are <PersonWithIcon url="" label="David Zbíral" />, and{" "}
              <PersonWithIcon url="" label="Robert L. J. Shaw" />. Other authors
              include <PersonWithIcon url="" label="Tomáš Hampejs" /> and{" "}
              <PersonWithIcon url="" label="Adam Mertel" />.
            </StyledTextListItem>
            <StyledTextListItem>
              The <b>lead developer of InkVisitor</b> is{" "}
              <PersonWithIcon url="" label="Adam Mertel" />. Other developers
              include <PersonWithIcon url="" label="Petr Hanák" />,{" "}
              <PersonWithIcon url="" label="Ján Mertel" />,{" "}
              <PersonWithIcon url="" label="Peter Ondrejka" />, and others.
            </StyledTextListItem>
            <StyledTextListItem>
              <b>Testers</b> of InkVisitor and{" "}
              <b>contributors to specific parts of the data model</b> include{" "}
              <PersonWithIcon url="" label="Katia Riccardo" />,{" "}
              <PersonWithIcon url="" label="Davor Salihović" />, and others.
            </StyledTextListItem>
          </StyledTextList>

          <StyledHeader>Funding</StyledHeader>
          <StyledTextList>
            <StyledTextListItem>
              <b>European Research Council</b> (project No. 101000442 “Networks
              of Dissent: Computational Modelling of Dissident and Inquisitorial
              Cultures in Medieval Europe (DISSINET)”, 9/2021–8/2026)
            </StyledTextListItem>
            <StyledTextListItem>
              <b>Czech Science Foundation</b> (EXPRO project No. GX19-26975X
              “Dissident Religious Cultures in Medieval Europe from the
              Perspective of Social Network Analysis and Geographic Information
              Systems”, 1/2019–8/2021)
            </StyledTextListItem>
            <StyledTextListItem>
              <b>Masaryk University, Faculty of Arts</b> (project “InkVisitor
              Development: Towards a Project-Neutral Open-Source Research
              Application for the Collection of Structured Relational Data from
              Texts”, 7/2022–8/2023)
            </StyledTextListItem>
            <StyledTextListItem>
              <b>
                Czech Ministry of Education, Youth and Sports & European Union
              </b>{" "}
              (project “Beyond Security: Role of Conflict in
              Resilience-Building”, 9/2023–6/2028)
            </StyledTextListItem>
          </StyledTextList>

          <StyledHeader>Cite InkVisitor</StyledHeader>

          <StyledTextList>
            <StyledTextListItem>
              Zbíral, David; Mertel, Adam; Hanák, Petr; Mertel, Ján; Ondrejka,
              Peter; Hampejs, Tomáš; and Shaw, Robert L. J. (2022). InkVisitor.
              Available online at:
              <LinkWithIcon
                url="https://github.com/DISSINET/InkVisitor"
                label="https://github.com/DISSINET/InkVisitor"
              />
            </StyledTextListItem>
          </StyledTextList>

          <StyledHeader>Cite CASTEMO</StyledHeader>

          <StyledTextList>
            <StyledTextListItem>
              Zbíral, David; Shaw, Robert L. J.; Hampejs, Tomáš; & Mertel, Adam.
              (2022). Model the source first! Towards Computer-Assisted Semantic
              Text Modelling and source criticism 2.0. Zenodo.
              <LinkWithIcon
                url="https://doi.org/10.5281/zenodo.6963579"
                label="https://doi.org/10.5281/zenodo.6963579"
              />
            </StyledTextListItem>
          </StyledTextList>
        </div>

        <StyledAcknowledgement>
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
          <AcknowledgementLogo
            src={LogoEUMSMT.default}
            url="https://www.msmt.cz/?lang=2"
          />
        </StyledAcknowledgement>
      </StyledContent>
    </StyledContentWrapper>
  );
};
