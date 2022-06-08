import React from 'react';
import { version, emitter, PseudoCli as cdkCli, require as cdkRequire } from 'cdk-web'

import logo from './react.svg';
import './Home.css';

const cdk = cdkRequire('aws-cdk-lib');
const { Function, Runtime, Code } = cdkRequire("aws-cdk-lib/aws-lambda");
const { RestApi, LambdaIntegration } = cdkRequire("aws-cdk-lib/aws-apigateway");


class HomeStack extends cdk.Stack {
  constructor(scope, id) {
    super(scope, id);
    const lambda = new Function(this, 'WebFunction', {
      code: Code.fromInline(`exports.handler = async () => ({ body: "deployed by: ${id}" })`),
      runtime: Runtime.NODEJS_16_X,
      deadLetterQueueEnabled: true,
      handler: 'index.handler',
    });
    const api = new RestApi(this, "web-deployer-api", {
      restApiName: "Web Service",
      description: "This service is deployed from web."
    });
    const integration = new LambdaIntegration(lambda, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });
    api.root.addMethod("GET", integration);
  }
}

class Home extends React.Component {
  state = {
    deployer: 'sepehr',
    deploying: false,
    awsSecret: '',
    awsKey: '',
    error: false,
    logs: '',
  }

  ready = () => {
    return !(this.state.deployer === '' || this.state.awsKey === '' || this.state.awsSecret === '');
  }

  prependLog = (message) => {
    this.setState({ logs: `${Date.now()}: ${message}\n${this.state.logs}` });
  }

  async deploy() {
    const app = new cdk.App();
    const stack = new HomeStack(app, this.state.deployer);
    const cli = new cdkCli({
      stack,
      credentials: {
        accessKeyId: this.state.awsKey,
        secretAccessKey: this.state.awsSecret,
      },
    });
    const { outputs } = await cli.deploy();
    this.prependLog(`DEPLOYED TO URL: ${Object.values(outputs)[0]}`);
  }

  handleDeployClick = () => {
    this.setState({ deploying: true, error: false, logs: '' });
    this.deploy()
      .catch(err => {
        this.setState({ error: true });
        this.prependLog(`ERROR: ${err.message}`);
      })
      .finally(() => {
        this.setState({ deploying: false })
      })
  }

  componentDidMount() {
    emitter.on('console', this.prependLog);
    emitter.on('stderr', this.prependLog);
    emitter.on('stdout', this.prependLog);
  }

  componentWillUnmount() {
    emitter.off('console');
    emitter.off('stderr');
    emitter.off('stdout');
  }

  render() {
    return (
      <div className="Home">
        <div className="Home-header">
          <img src={logo} className={`Home-logo ${this.state.deploying && 'deploying'} ${this.state.error && 'error'}`} alt="logo" />
          <h2>Welcome to CDK version: {version['aws-cdk-lib']}</h2>
        </div>
        <pre>
          <form>
            <label>
              Deployer:
              &nbsp;
              <input
                name="deployer"
                value={this.state.deployer}
                onChange={({ target }) => this.setState({ deployer: target.value })}
              />
            </label>
            &nbsp;
            <input
              type="button"
              value="Deploy"
              disabled={!this.ready()}
              onClick={this.handleDeployClick}
            />
            <br />
            <br />
            <label>
              AWS_ACCESS_KEY_ID:
              &nbsp;
              <input
                type="password"
                name="AWS_ACCESS_KEY_ID"
                value={this.state.awsKey}
                onChange={({ target }) => this.setState({ awsKey: target.value })}
              />
            </label>
            <br />
            <br />
            <label>
              AWS_SECRET_ACCESS_KEY:
              &nbsp;
              <input
                type="password"
                name="AWS_SECRET_ACCESS_KEY"
                value={this.state.awsSecret}
                onChange={({ target }) => this.setState({ awsSecret: target.value })}
              />
            </label>
          </form>
          <br />
          <textarea disabled cols={120} rows={25} value={this.state.logs}></textarea>
        </pre>
      </div>
    );
  }
}

export default Home;
