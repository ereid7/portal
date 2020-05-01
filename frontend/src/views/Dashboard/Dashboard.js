import React, {Component} from "react";
import UserService from "../../core/services/PocketUserService";
import {Alert, Button, ButtonGroup, Col, Dropdown, Row} from "react-bootstrap";
import "./Dashboard.scss";
import {_getDashboardPath, DASHBOARD_PATHS} from "../../_routes";
import {Link} from "react-router-dom";
import InfoCard from "../../core/components/InfoCard/InfoCard";
import SortableTable from "../../core/components/SortableTable";
import {APPLICATIONS_LIMIT, NODES_LIMIT, TABLE_COLUMNS} from "../../_constants";
import NetworkService from "../../core/services/PocketNetworkService";
import Loader from "../../core/components/Loader";
import ApplicationService from "../../core/services/PocketApplicationService";
import {mapStatusToField} from "../../_helpers";
import NodeService from "../../core/services/PocketNodeService";

class Dashboard extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      alert: true,
      loading: true,
      chains: [],
      userApps: [],
      userNodes: [],
    };
  }

  async componentDidMount() {
    const userEmail = UserService.getUserInfo().email;

    const userApps = await ApplicationService.getAllUserApplications(
      userEmail, APPLICATIONS_LIMIT
    );

    const userNodes = await NodeService.getAllUserNodes(userEmail, NODES_LIMIT);

    // TODO: Replace sample data with actual data from backend
    const chains = await NetworkService.getAvailableNetworkChains();

    this.setState({userApps, userNodes, chains, loading: false});
  }

  render() {
    const {
      alert,
      chains,
      loading,
      userApps: allUserApps,
      userNodes: allUserNodes,
    } = this.state;

    const cards = [
      {title: "US $0.60", subtitle: "POKT Price"},
      {title: "33,456", subtitle: "Total Staked Tokens"},
      {title: "23,345", subtitle: "Total of nodes"},
      {title: "21,479", subtitle: "Total Staked nodes"},
      {title: "38,353", subtitle: "Total of apps"},
      {title: "37,235", subtitle: "Total Staked apps"},
    ];

    if (loading) {
      return <Loader />;
    }

    const userApps = allUserApps.map(mapStatusToField);
    const userNodes = allUserNodes.map(mapStatusToField);

    return (
      <div id="dashboard">
        {alert && (
          <Alert
            variant="primary"
            onClose={() => this.setState({alert: false})}
            dismissible
          >
            <Alert.Heading>
              Welcome back {UserService.getUserInfo().name}!
            </Alert.Heading>
          </Alert>
        )}
        <Row>
          <Col sm="8" md="8" lg="8">
            <h2 className="ml-1">Network Information</h2>
          </Col>
          <Col
            sm="4"
            md="4"
            lg="4"
            className="d-flex justify-content-end general-info"
          >
            <Dropdown as={ButtonGroup} className="cta">
              <Button variant="dark" className="ml-4 pl-5 pr-5">
                Apps
              </Button>

              <Dropdown.Toggle split variant="dark" id="dropdown-split-basic" />

              <Dropdown.Menu>
                <Link to={_getDashboardPath(DASHBOARD_PATHS.createAppInfo)}>
                  <Dropdown.Item as="button">Create new app</Dropdown.Item>
                </Link>
                <Dropdown.Item href="#/action-2">Import app</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown as={ButtonGroup} className="cta">
              <Button variant="secondary" className="ml-4 pl-5 pr-5">
                Nodes
              </Button>

              <Dropdown.Toggle
                split
                variant="secondary"
                id="dropdown-split-basic"
              />

              <Dropdown.Menu>
                <Link to={_getDashboardPath(DASHBOARD_PATHS.createAppInfo)}>
                  <Dropdown.Item as="button">Create new node</Dropdown.Item>
                </Link>
                <Dropdown.Item href="#/action-2">Import node</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
        <Row className="stats mt-3 mb-4">
          {cards.map((card) => (
            <Col key={card.title}>
              <InfoCard title={card.title} subtitle={card.subtitle} />
            </Col>
          ))}
        </Row>
        <Row>
          <Col lg="6">
            <SortableTable
              keyField="hash"
              title="Supported Blockchains"
              columns={TABLE_COLUMNS.NETWORK_CHAINS}
              data={chains}
            />
          </Col>
          <Col lg="6">
            <SortableTable
              keyField="hash"
              title="Most popular chains"
              columns={TABLE_COLUMNS.NETWORK_CHAINS}
              data={chains}
            />
          </Col>
        </Row>
        <Row className="mt-5 mb-4">
          <Col lg="6">
            <SortableTable
              keyField="hash"
              title="Registered  Nodes"
              columns={TABLE_COLUMNS.NODES}
              data={userNodes}
            />
          </Col>
          <Col lg="6">
            <SortableTable
              title="Registered Apps"
              keyField="networkData.address"
              columns={TABLE_COLUMNS.APPS}
              data={userApps}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

export default Dashboard;
