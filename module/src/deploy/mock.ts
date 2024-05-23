import { DeployFunction } from 'hardhat-deploy/types'

const ENTRY_POINT = process.env.DEPLOYMENT_ENTRY_POINT_ADDRESS

const deploy: DeployFunction = async ({ deployments, getNamedAccounts, network }) => {
  if (!network.tags.test) {
    return
  }

  const { deployer } = await getNamedAccounts()
  const { deploy } = deployments

  const entryPoint = await deployments.getOrNull('EntryPoint').then((deployment) => deployment?.address ?? ENTRY_POINT)

  await deploy('SafeMock', {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true,
  })

  await deploy('MockValidator', {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true,
  })

  const ad = await deploy('P256Verifier', {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true,
  })

  console.log('P256Verifier', ad.address)

}

deploy.dependencies = ['entrypoint']

export default deploy
