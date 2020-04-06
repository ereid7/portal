import {
  Account,
  Application,
  ApplicationParams,
  CoinDenom,
  Configuration,
  HttpRpcProvider,
  Pocket,
  QueryAppResponse,
  QueryAppsResponse,
  RawTxResponse,
  StakingStatus
} from "@pokt-network/pocket-js";
import {PocketAAT} from "@pokt-network/aat-js";
import {Configurations} from "../_configuration";
import assert from "assert";

const POCKET_NETWORK_CONFIGURATION = Configurations.pocketNetwork;

const POCKET_CONFIGURATION = new Configuration(
  POCKET_NETWORK_CONFIGURATION.max_dispatchers, POCKET_NETWORK_CONFIGURATION.max_sessions, 0, POCKET_NETWORK_CONFIGURATION.request_timeout);


/**
 * Convert list of string nodes to URL nodes.
 *
 * @param {[string]} nodes List of nodes of Pokt network.
 *
 * @returns {URL[]} Nodes urls.
 */
function getNodeURLS(nodes) {
  assert.notEqual(null, nodes);

  return nodes.map((node) => {
    const nodeURL = node + ":" + POCKET_NETWORK_CONFIGURATION.default_rpc_port;

    return new URL(nodeURL);
  });
}


/**
 * Get RPC dispatcher provider using a Pokt network node.
 *
 * @param {string} node Node used to RPC dispatcher provider.
 *
 * @returns {HttpRpcProvider} The main rpc provider in the node.
 */
function getRPCDispatcher(node) {
  assert.notEqual(null, node);

  const nodeURL = node + ":" + POCKET_NETWORK_CONFIGURATION.default_rpc_port;

  return new HttpRpcProvider(new URL(nodeURL));
}

/**
 * Get the default pokt network nodes.
 *
 * @returns {{nodes:string[], rpcProvider: string}} List of default nodes.
 */
export function get_default_pocket_network() {
  return {
    nodes: POCKET_NETWORK_CONFIGURATION.nodes.main,
    rpcProvider: POCKET_NETWORK_CONFIGURATION.nodes.rpc_provider
  };
}

export default class PocketService {

  /**
   * @param {string[]} nodes List of nodes of Pokt network.
   * @param {string} rpcProvider RPC provider of Pokt network.
   */
  constructor(nodes, rpcProvider) {
    /** @private */
    this.__pocket = new Pocket(getNodeURLS(nodes), getRPCDispatcher(rpcProvider), POCKET_CONFIGURATION);
  }


  /**
   * Create account on Pokt network.
   *
   * @param {string} passphrase Passphrase used to generate account.
   *
   * @returns {Promise<Account | Error>} A pocket account.
   */
  async createAccount(passphrase) {
    return this.__pocket.keybase.createAccount(passphrase);
  }

  /**
   * Retrieve account from network.
   *
   * @param {string} addressHex Address of account to retrieve in hex.
   *
   * @returns {Promise<Account | Error>} A pocket account.
   */
  async getAccount(addressHex) {
    return this.__pocket.keybase.getAccount(addressHex);
  }

  /**
   * Import an account to Pokt network using private key of the account.
   *
   * @param {string} privateKeyHex Private key of the account to import in hex.
   * @param {string} passphrase Passphrase used to generate the account.
   *
   * @returns {Promise<Account | Error>} A pocket account.
   */
  async importAccount(privateKeyHex, passphrase) {
    return this.__pocket.keybase.importAccount(Buffer.from(privateKeyHex, "hex"), passphrase);
  }

  /**
   * Export Private key of the account.
   *
   * @param {string} addressHex Address of account to export in hex.
   * @param {string} passphrase Passphrase used to generate the account.
   *
   * @returns {Promise<Buffer | Error>} A buffer of private key.
   */
  async exportAccount(addressHex, passphrase) {
    return this.__pocket.keybase.exportAccount(addressHex, passphrase);
  }

  /**
   * Export raw Private key of the account.
   *
   * @param {string} addressHex Address of account to export in hex.
   * @param {string} passphrase Passphrase used to generate the account.
   * @param {string} encoding Encoding used to encode the buffer of private key.
   *
   * @returns {Promise<string>} A Hex private key.
   */
  async exportRawAccount(addressHex, passphrase, encoding = "hex") {
    /** @type {Buffer} */
    const privateKey = await this.__pocket.keybase.exportAccount(addressHex, passphrase);

    return privateKey.toString(encoding);
  }

  /**
   * Retrieve the free tier account.
   *
   * @returns {Promise<Account | Error>} Free Tier account.
   * @throws Error If the account is not valid.
   */
  async getFreeTierAccount() {
    const privateKey = POCKET_NETWORK_CONFIGURATION.free_tier_account;

    if (!privateKey) {
      throw Error("Free Tier account value is required");
    }

    const account = await this.importAccount(privateKey, "freeTier");

    if (account instanceof Error) {
      throw Error("Free Tier account is not valid");
    }

    return account;
  }

  /**
   * Get an Application Authentication Token to be used on Pokt network.
   *
   * @param {Account} clientAccount The client Pokt account our dApp is connecting to.
   * @param {Account} applicationAccount The funded applications Pokt account address.
   * @param {string} applicationAccountPassphrase The passphrase used to generate application address.
   *
   * @returns {Promise<PocketAAT>} An application authorization tokens.
   */
  async getApplicationAuthenticationToken(clientAccount, applicationAccount, applicationAccountPassphrase) {
    const aatVersion = POCKET_NETWORK_CONFIGURATION.aat_version;

    const clientPublicKey = clientAccount.publicKey.toString("hex");
    const applicationPublicKeyHex = applicationAccount.publicKey.toString("hex");
    const applicationPrivateKeyHex = await this.exportRawAccount(applicationAccount.addressHex, applicationAccountPassphrase);

    return PocketAAT.from(aatVersion, clientPublicKey, applicationPublicKeyHex, applicationPrivateKeyHex);
  }

  /**
   * Get Application data.
   *
   * @param {string} addressHex Account address.
   *
   * @returns {Application} The account data.
   * @throws Error If Query fails.
   * @async
   */
  async getApplication(addressHex) {
    /** @type {QueryAppResponse} */
    const applicationResponse = await this.__pocket.rpc().query.getApp(addressHex);

    if (applicationResponse instanceof Error) {
      throw applicationResponse;
    }

    return applicationResponse.application;
  }

  /**
   * Get Applications data.
   *
   * @param {StakingStatus} status Status of the apps to retrieve.
   *
   * @returns {Promise<Application[]>} The applications data.
   * @throws Error If Query fails.
   * @async
   */
  async getApplications(status) {
    // TODO: Change the status string for StakingStatus parameter
    /** @type {QueryAppsResponse} */
    const applicationsResponse = await this.__pocket.rpc().query.getApps("staked");

    if (applicationsResponse instanceof Error) {
      throw applicationsResponse;
    }

    return applicationsResponse.applications;
  }

  /**
   * Get Application Parameters data.
   *
   * @returns {Promise<ApplicationParams>} The application parameters.
   * @throws Error If Query fails.
   * @async
   */
  async getApplicationParameters() {
    const applicationParametersResponse = await this.__pocket.rpc().query.getAppParams();

    if (applicationParametersResponse instanceof Error) {
      throw applicationParametersResponse;
    }

    return applicationParametersResponse.applicationParams;
  }

  /**
   * Stake an application in pocket network.
   *
   * @param {Account} applicationAccount Application account to stake.
   * @param {string} passPhrase Passphrase used to encrypt account.
   * @param {string} poktAmount Pocket amount to stake.
   * @param {string[]} networkChains Network Chains to stake.
   *
   * @returns {Promise<RawTxResponse>} The transaction hash.
   * @throws Error if transaction fails.
   */
  async stakeApplication(applicationAccount, passPhrase, poktAmount, networkChains) {
    const {chain_id, transaction_fee} = POCKET_NETWORK_CONFIGURATION;
    const publicKey = applicationAccount.publicKey.toString("hex");

    const transactionSender = await this.__pocket.withImportedAccount(applicationAccount.address, passPhrase);

    const transactionResponse = await transactionSender.appStake(publicKey, networkChains, poktAmount)
      .submit(chain_id, transaction_fee, CoinDenom.Upokt, "Stake an application");

    if (transactionResponse instanceof Error) {
      throw transactionResponse;
    }

    return transactionResponse;
  }
}
