/* eslint-disable react/prop-types */
import React, {Component} from "react";
import {Col, Form, Row} from "react-bootstrap";
import CardDisplay from "../../../core/components/Payment/CardDisplay/CardDisplay";
import UserService from "../../../core/services/PocketUserService";
import PaymentService from "../../../core/services/PocketPaymentService";
import "./OrderSummary.scss";
import Loader from "../../../core/components/Loader";
import {ElementsConsumer} from "@stripe/react-stripe-js";
import PaymentContainer from "../../../core/components/Payment/Stripe/PaymentContainer";
import StripePaymentService from "../../../core/services/PocketStripePaymentService";
import {_getDashboardPath, DASHBOARD_PATHS} from "../../../_routes";
import InfoCard from "../../../core/components/InfoCard/InfoCard";
import NewCardNoAddressForm from "../../../core/components/Payment/Stripe/NewCardNoAddressForm";
import AppAlert from "../../../core/components/AppAlert";
import UnauthorizedAlert from "../../../core/components/UnauthorizedAlert";
import {Link} from "react-router-dom";
import {formatCurrency, scrollToId} from "../../../_helpers";
import ApplicationService from "../../../core/services/PocketApplicationService";
import LoadingButton from "../../../core/components/LoadingButton";
import {ITEM_TYPES} from "../../../_constants";
import NodeService from "../../../core/services/PocketNodeService";

class OrderSummary extends Component {
  constructor(props, context) {
    super(props, context);

    this.makePurchaseWithSavedCard = this.makePurchaseWithSavedCard.bind(this);
    this.saveNewCard = this.saveNewCard.bind(this);
    this.goToInvoice = this.goToInvoice.bind(this);

    this.state = {
      setMethodDefault: false,
      type: "",
      paymentIntent: {},
      quantity: {
        number: 0,
        description: "",
      },
      cost: {
        number: 0,
        description: "",
      },
      total: 0,
      currentAccountBalance: 0,
      paymentMethods: [],
      selectedPaymentMethod: {},
      loading: false,
      loadingPayment: false,
      agreeTerms: false,
      alert: {
        show: false,
        variant: "",
        message: "",
      },
      unauthorized: false,
      purchasing: false,
    };
  }

  componentDidMount() {
    this.setState({loading: true});
    // eslint-disable-next-line react/prop-types
    if (this.props.location.state === undefined) {
      this.setState({loading: false, unauthorized: true});
      return;
    }

    const {
      type,
      paymentIntent,
      quantity,
      cost,
      total,
      currentAccountBalance,
    } = this.props.location.state;

    const user = UserService.getUserInfo().email;

    PaymentService.getPaymentMethods(user)
      .then(paymentMethods => {

        const selectedPaymentMethod =
          paymentMethods.find(
            (pm) => PaymentService.getDefaultPaymentMethod() === pm.id
          ) || paymentMethods[0];

        this.setState({
          loading: false,
          selectedPaymentMethod,
          paymentMethods,
          type,
          paymentIntent,
          quantity,
          cost,
          total,
          currentAccountBalance
        });
      });
  }

  goToInvoice() {
    const {
      paymentIntent,
      type,
      selectedPaymentMethod,
      quantity,
      cost,
      total,
      currentAccountBalance,
    } = this.state;

    return this.props.history.replace({
      pathname: _getDashboardPath(DASHBOARD_PATHS.invoice),
      state: {
        type,
        paymentId: paymentIntent.id,
        paymentMethod: selectedPaymentMethod,
        details: [
          {value: quantity.number, text: quantity.description, format: false},
          {value: cost.number, text: cost.description, format: true},
        ],
        total,
        currentAccountBalance,
      },
    });
  }

  async makePurchaseWithSavedCard(e, stripe) {
    e.preventDefault();

    this.setState({purchasing: true});

    const {paymentIntent, selectedPaymentMethod, type} = this.state;

    const result = await StripePaymentService
      .confirmPaymentWithSavedCard(stripe, paymentIntent.paymentNumber, selectedPaymentMethod.id, selectedPaymentMethod.billingDetails);

    if (result.error) {
      this.setState({
        purchasing: false,
        alert: {
          show: true,
          variant: "warning",
          message: <h4>{result.error.message}</h4>,
        },
      });
      scrollToId("alert");
      return;
    }

    if (type === ITEM_TYPES.APPLICATION) {
      // Stake application
      const {
        privateKey,
        passphrase,
        chains,
        address,
      } = ApplicationService.getApplicationInfo();
      const application = {privateKey, passphrase};

      const url = _getDashboardPath(DASHBOARD_PATHS.appDetail);
      const detail = url.replace(":address", address);
      const applicationLink = `${window.location.origin}${detail}`;

      this.setState({loading: true});

      ApplicationService.stakeApplication(
        application, chains, result.paymentIntent.id, applicationLink
      ).then(() => {});
    } else {
      // Stake Node
      const {
        privateKey,
        passphrase,
        chains,
        address,
        serviceURL
      } = NodeService.getNodeInfo();
      const node = {privateKey, passphrase, serviceURL};

      const url = _getDashboardPath(DASHBOARD_PATHS.nodeDetail);
      const detail = url.replace(":address", address);
      const nodeLink = `${window.location.origin}${detail}`;

      this.setState({loading: true});

      NodeService.stakeNode(
        node, chains, result.paymentIntent.id, nodeLink
      ).then(() => {});
    }

    this.goToInvoice();
  }

  saveNewCard(e, cardData, stripe) {
    e.preventDefault();

    const {setMethodDefault} = this.state;
    const {cardHolderName: name} = cardData;
    const billingDetails = {name};

    StripePaymentService.createPaymentMethod(stripe, cardData.card, billingDetails)
      .then(async (result) => {
        if (result.errors) {
          this.setState({
            alert: {
              show: true,
              variant: "warning",
              message: "There was an error adding your card",
            },
          });
          return;
        }

        if (result.paymentMethod) {
          const user = UserService.getUserInfo().email;
          const paymentMethods = await PaymentService.getPaymentMethods(user);

          const selectedPaymentMethod = paymentMethods.find(
            (pm) => result.paymentMethod.id === pm.id
          );

          const alert = {
            show: true,
            variant: "primary",
            message: "Your payment method was successfully added",
          };

          if (setMethodDefault) {
            PaymentService.setDefaultPaymentMethod(result.paymentMethod.id);
          }

          this.setState({alert, paymentMethods, selectedPaymentMethod});
        }
      });
  }

  render() {
    const {
      selectedPaymentMethod,
      paymentMethods: allPaymentMethods,
      quantity,
      cost,
      total,
      currentAccountBalance,
      loading,
      agreeTerms,
      alert,
      unauthorized,
      purchasing,
    } = this.state;

    const cards = [
      {title: quantity.number, subtitle: quantity.description},
      {title: `${cost.number} USD`, subtitle: cost.description},
      {title: `-${formatCurrency(currentAccountBalance)} USD`, subtitle: "Current balance"}
    ];

    const paymentMethods = allPaymentMethods.map((method) => {
      return {
        id: method.id,
        cardData: {
          type: method.brand,
          digits: `**** **** **** ${method.lastDigits}`,
        },
        holder: method.billingDetails.name,
      };
    });

    if (loading) {
      return <Loader/>;
    }

    if (unauthorized) {
      return <UnauthorizedAlert/>;
    }

    return (
      <div id="order-summary">
        {alert.show && (
          <AppAlert
            dismissible
            onClose={() => this.setState({alert: {show: false}})}
            title={alert.message}
            variant={alert.variant}
          ></AppAlert>
        )}
        <div className="title-page mb-4">
          <h1>Order summary</h1>
        </div>
        <Row>
          <Col lg="8" md="8" sm="8" className="title-page">
            <h2 className="sub">Confirm your payment method</h2>
            <Form className="cards">
              {paymentMethods.map((card, idx) => {
                const {cardData, holder} = card;

                return (
                  <div key={idx} className="payment-method">
                    <Form.Check
                      inline
                      label=""
                      type="radio"
                      checked={card.id === selectedPaymentMethod.id}
                      onChange={() => {
                        this.setState({selectedPaymentMethod: card});
                      }}
                      id={`payment-method-${idx}`}
                    />
                    <CardDisplay
                      cardData={cardData}
                      holder={holder}
                      onDelete={this.deleteCard}
                    />
                  </div>
                );
              })}
            </Form>
            <h5 className="mt-5 mb-4">Add a new card</h5>

            <h5 className="card-form-title">Enter your card information</h5>
            <NewCardNoAddressForm
              formActionHandler={this.saveNewCard}
              actionButtonName="Add card"
              setDefaultHandler={(setMethodDefault) =>
                this.setState({setMethodDefault})
              }
            />
          </Col>
          <Col lg="4" md="4" sm="4" className="title-page pr-5">
            <h2 className="sub">Review your order</h2>
            <div className="mt-5 order">
              {cards.map((c, idx) => (
                <div key={idx} className="item">
                  <p>{c.subtitle}</p>
                  <p>{c.title}</p>
                </div>
              ))}
            </div>
            <InfoCard
              className="pt-4 mb-4 pr-4 text-center"
              title={`${total} USD`}
              subtitle={"Total cost"}
            />
            <Form.Check
              checked={agreeTerms}
              onChange={() => this.setState({agreeTerms: !agreeTerms})}
              id="terms-checkbox"
              type="checkbox"
              className="mb-3"
              label={
                <p className="agree">
                  I agree to Pocket Network&#39;s Purchase{" "}
                  <Link to={_getDashboardPath(DASHBOARD_PATHS.termsOfService)}>
                    <br/>
                    Terms and Conditions.
                  </Link>
                </p>
              }
            />
            <br/>
            <PaymentContainer>
              <ElementsConsumer>
                {({_, stripe}) => (
                  <Form
                    onSubmit={(e) => this.makePurchaseWithSavedCard(e, stripe)}
                    className=""
                  >
                    <LoadingButton
                      loading={purchasing}
                      buttonProps={{
                        disabled: !agreeTerms,
                        variant: "primary",
                        className: "confirm pr-5 pl-5",
                        type: "submit",
                      }}
                    >
                      <span>Confirm payment</span>
                    </LoadingButton>
                  </Form>
                )}
              </ElementsConsumer>
            </PaymentContainer>
          </Col>
        </Row>
      </div>
    );
  }
}

export default OrderSummary;
