import React, {Component} from "react";
import {Button, Card, Col, Row} from "react-bootstrap";
import "./TierSelection.scss";

class TierSelection extends Component {
  state = {};
  render() {
    return (
      <div id="tier-selection" className="mt-4 ml-5">
        <Row>
          <Col id="titles">
            <h1>Choose what is more convenient for your app</h1>
            <p>Connect your app to any blockchain with our free tier</p>
          </Col>
        </Row>
        <Row>
          <Col lg={{span: 4, offset: 2}}>
            <Card className="tier-card mr-5">
              <Card.Body>
                <h2>Free tier</h2>
                <p>Limited to XXX relays per session</p>
                <p>Access to AAT, but not ownership</p>
                <p>Staked POKT is own by Pocket Network Inc</p>
                <p>Unstake balance unavailable</p>
                {/*eslint-disable-next-line jsx-a11y/anchor-is-valid*/}
                <a className="link cta" href="#">
                  How it works
                </a>
                <br />
                <Button size="lg" variant="dark" className="pr-5 pl-5 mt-3">
                  Get Free Tier
                </Button>
                <br />
                <small>By getting free tier you agree to Pocket's</small>
                <small>
                  {/*eslint-disable-next-line jsx-a11y/anchor-is-valid*/}
                  <a className="link" href="#">
                    Terms and conditions
                  </a>
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={{span: 4}} className="right-tier">
            <Card className="tier-card mr-5">
              <Card.Body>
                <h2 className="custom-tier-title">Custom tier</h2>
                <p>Custom amount of relays</p>
                <p>ATT ownership</p>
                <p>Staked POKT is own by the user</p>
                <p>Unstake balance available for transfers</p>
                {/*eslint-disable-next-line jsx-a11y/anchor-is-valid*/}
                <a className="link cta" href="#">
                  Learn More
                </a>
                <br />
                <Button size="lg" variant="dark" className="pr-5 pl-5 mt-3">
                  Customize your tier
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default TierSelection;
