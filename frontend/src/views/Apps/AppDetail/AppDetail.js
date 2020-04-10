import React, {Component} from "react";
import BootstrapTable from "react-bootstrap-table-next";
import {Alert, Button, Col, Row, Badge} from "react-bootstrap";
import InfoCard from "../../../core/components/InfoCard/InfoCard";
import HelpLink from "../../../core/components/HelpLink";
import {NETWORK_TABLE_COLUMNS} from "../../../constants";
import "./AppDetail.scss";
import ApplicationService, {
  PocketApplicationService,
} from "../../../core/services/PocketApplicationService";
import NetworkService from "../../../core/services/PocketNetworkService";

class AppDetail extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      pocketApplication: {},
      networkData: {},
      chains: [],
      freeTier: false,
    };
  }

  async componentDidMount() {
    // eslint-disable-next-line react/prop-types
    const {address} = this.props.match.params;

    const {
      pocketApplication,
      networkData,
    } = await ApplicationService.getApplication(address);

    const chains = await NetworkService.getNetworkChains(networkData.chains);

    this.setState({pocketApplication, networkData, chains});
  }

  render() {
    const {
      name,
      url,
      contactEmail,
      description,
      icon,
    } = this.state.pocketApplication;
    const {
      jailed,
      max_relays,
      staked_tokens,
      status,
      public_key,
      address,
    } = this.state.networkData;

    const {freeTier} = this.state;

    let statusCapitalized = "";

    if (status) {
      statusCapitalized = status[0].toUpperCase() + status.slice(1);
    }

    const {chains} = this.state;

    const generalInfo = [
      {title: `${staked_tokens} POKT`, subtitle: "Stake tokens"},
      {title: statusCapitalized, subtitle: "Stake status"},
      {title: max_relays, subtitle: "Max Relays"},
    ];

    const contactInfo = [
      {title: url, subtitle: "URL"},
      {title: contactEmail, subtitle: "Email"},
    ];

    // TODO: Get aat from backend
    const aat = {
      version: "0.0.1",
      app_address: "bd4a...",
      client_pub_key: "9948...",
      signature: "a383...",
    };

    const aatStr = JSON.stringify(aat, null, 2);

    return (
      <div id="app-detail">
        <Row>
          <Col>
            <div className="head">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img src={icon} />
              <div className="info">
                <h1 className="d-flex align-items-baseline">
                  {name}
                  {freeTier && (
                    <Badge variant="dark" className="ml-2 pt-2 pb-2 pl-3 pr-3">
                      Free Tier
                    </Badge>
                  )}
                </h1>
                <p className="description">{description}</p>
              </div>
            </div>
          </Col>
        </Row>
        <h2 className="mt-4">General Information</h2>
        <Row className="mt-2 stats">
          {generalInfo.map((card, idx) => (
            <Col key={idx}>
              <InfoCard title={card.title} subtitle={card.subtitle} />
            </Col>
          ))}
          <Col>
            <InfoCard title={jailed === 1 ? "YES" : "NO"} subtitle={"Jailed"}>
              {/*eslint-disable-next-line jsx-a11y/anchor-is-valid*/}
              <a className="link" href="#">
                Take out of jail
              </a>
            </InfoCard>
          </Col>
        </Row>
        <Row className="contact-info stats">
          {contactInfo.map((card, idx) => (
            <Col key={idx}>
              <InfoCard
                className="pl-4"
                title={card.title}
                subtitle={card.subtitle}
              >
                <span></span>
              </InfoCard>
            </Col>
          ))}
        </Row>
        <Row className="mt-3">
          <Col>
            <div className="info-section">
              <h3>Address</h3>
              <Alert variant="dark">{address}</Alert>
            </div>
            <div className="info-section">
              <h3>Public Key</h3>
              <Alert variant="dark">{public_key}</Alert>
            </div>
          </Col>
          {freeTier && (
            <Col>
              <div id="aat-info" className="mb-2">
                <h3>AAT</h3>
                <span>
                  <HelpLink size="2x" />
                  <p>How to create an AAT?</p>
                </span>
              </div>
              <div className="aat-code">
                <pre>
                  <code className="language-html" data-lang="html">
                    {"# Returns\n"}
                    <span id="aat">{aatStr}</span>
                  </code>
                  <p
                    onClick={() =>
                      PocketApplicationService.copyToClickboard(aatStr)
                    }
                  >
                    Copy
                  </p>
                </pre>
              </div>
            </Col>
          )}
        </Row>
        <Row>
          <Col>
            <h3>Networks</h3>
            <BootstrapTable
              classes="table app-table table-striped"
              keyField="hash"
              data={chains}
              columns={NETWORK_TABLE_COLUMNS}
              bordered={false}
            />
          </Col>
        </Row>
        <Row className="mt-3 mb-4">
          <Col className="action-buttons">
            <div className="main-options">
              <Button variant="dark" className="pr-4 pl-4">
                Unstake
              </Button>
              <Button variant="secondary" className="ml-3 pr-4 pl-4">
                New Purchase
              </Button>
            </div>
            <Button href="#" variant="link" className="link mt-3">
              Delete App
            </Button>
          </Col>
        </Row>
      </div>
    );
  }
}

export default AppDetail;