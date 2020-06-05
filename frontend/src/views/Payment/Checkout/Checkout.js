/* eslint-disable react/prop-types */
import React, {Component} from "react";
import "./Checkout.scss";
import {Button, Col, Row} from "react-bootstrap";
import ReactToPrint from "react-to-print";
import Invoice from "../../../core/components/Payment/Invoice";
import {capitalize, formatCurrency} from "../../../_helpers";
import PaymentService from "../../../core/services/PocketPaymentService";
import moment from "moment";
import {ITEM_TYPES} from "../../../_constants";
import ApplicationService from "../../../core/services/PocketApplicationService";
import NodeService from "../../../core/services/PocketNodeService";
import {_getDashboardPath, DASHBOARD_PATHS} from "../../../_routes";
import {Link} from "react-router-dom";
import UnauthorizedAlert from "../../../core/components/UnauthorizedAlert";
import Loader from "../../../core/components/Loader";
import PocketUserService from "../../../core/services/PocketUserService";
import AppAlert from "../../../core/components/AppAlert";
import PrintableInvoice from "../PrintableInvoice/PrintableInvoice";

class Checkout extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      loading: false,
      type: "",
      invoice: {
        owner: "",
        id: "",
        date: "",
        card: "",
      },
      details: [],
      total: 0,
      currentAccountBalance: 0,
      address: "",
      unauthorized: false,
    };
  }

  async componentDidMount() {
    this.setState({loading: true});
    if (this.props.location.state === undefined) {
      this.setState({loading: false, unauthorized: true});
      return;
    }

    const {
      type,
      paymentId,
      paymentMethod,
      details,
      total,
      currentAccountBalance,
    } = this.props.location.state;
    const address =
      type === ITEM_TYPES.APPLICATION
        ? ApplicationService.getApplicationInfo().address
        : NodeService.getNodeInfo().address;

    const {
      paymentID: id,
      createdDate: date,
    } = await PaymentService.getPaymentDetail(paymentId);

    const {brand, lastDigits} = paymentMethod;
    const userName = PocketUserService.getUserInfo().name;

    const invoice = {
      id: id.replace("pi_", "").toLowerCase(),
      date: moment(date).format("DD MM YYYY"),
      owner: userName,
      card: `${capitalize(brand)} **** **** **** ${lastDigits}`,
    };

    this.setState({
      loading: false,
      type,
      address,
      invoice,
      details,
      total,
      currentAccountBalance,
      paymentMethod,
    });
  }

  handlePrintInvoice() {
    window.print();
  }

  render() {
    const {owner, id, date, card} = this.state.invoice;
    const {
      details,
      total,
      type,
      address,
      loading,
      unauthorized,
      currentAccountBalance,
    } = this.state;
    const isApp = type === ITEM_TYPES.APPLICATION;

    const information = [
      {text: "Date", value: date},
      {text: "Bill to", value: owner},
      {text: "Invoice", value: id},
      {text: "Card Detail", value: card},
    ];

    const items = [
      ...details,
      {text: "Current balance", value: currentAccountBalance, format: true},
    ].map((it) => {
      if (!it.format) {
        return it;
      }
      return {text: it.text, value: `US${formatCurrency(it.value)}`};
    });

    const totalAmount = formatCurrency(total);

    if (loading) {
      return <Loader />;
    }

    if (unauthorized) {
      return <UnauthorizedAlert />;
    }

    const detailButton = (
      <Link
        to={() => {
          const route = isApp
            ? DASHBOARD_PATHS.appDetail
            : DASHBOARD_PATHS.nodeDetail;
          const url = _getDashboardPath(route);

          return url.replace(":address", address);
        }}
      >
        <Button variant="primary" className="mt-1 float-right cta">
          <span>Go to {isApp ? "App" : "Node"} details</span>
        </Button>
      </Link>
    );

    if (unauthorized) {
    }

    return (
      <>
        <div id="nodes-checkout">
          <Row className="mb-4">
            <AppAlert
              className="pb-3 pt-3"
              title={"This transaction may take some time to be completed."}
            >
              <p>
                On the next block generated your {isApp ? "app" : "node"} will
                be staked, also we will notify you by email.
              </p>
            </AppAlert>
          </Row>
          <Row>
            <Col className="header">
              {detailButton}
              <h1>Enjoy your purchase</h1>
              <p>Please wait a few minutes until the process is completed.</p>
            </Col>
          </Row>

          <div className="mb-4 title-page">
            <h2>Your invoice</h2>
          </div>
          <Row className="segment mb-2">
            <Invoice
              title={`Invoice ${id}`}
              information={information}
              items={items}
              total={totalAmount}
            />
          </Row>
        </div>
        <ReactToPrint
          trigger={() => (
            <div className="print">
              <img
                src={"/assets/printer.svg"}
                className="icon"
                alt="print-icon"
              />{" "}
              <Button className="link">
                Print
              </Button>{" "}
              your invoice
            </div>
          )}
          content={() => this.componentRef}
          bodyClass="printable-invoice"
          copyStyles={true}
        />
        <PrintableInvoice
          ref={(el) => (this.componentRef = el)}
          invoiceItems={[
            {text: "invoice", value: id},
            {text: "bill to", value: owner},
            {text: "date", value: date},
            {text: "card detail", value: card},
          ]}
          purchaseDetails={items}
          total={totalAmount}
          cardHolderName={owner}
        />
      </>
    );
  }
}

export default Checkout;
