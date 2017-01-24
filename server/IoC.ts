import { ServerResolveIndex } from './caches/ServerResolveIndex';
import { Initializable } from './Initializable';
import { TsResourceParser } from './parsing/TsResourceParser';
import { Logger } from './utilities/Logger';
import { Container as IoCContainer } from 'inversify';

const container = new IoCContainer(),
    serverLogger = new Logger();

container.bind(Logger).toConstantValue(serverLogger);
container.bind(TsResourceParser).to(TsResourceParser);

container.bind<Initializable>('ServerParts').toConstantValue(serverLogger);
container.bind<Initializable>('ServerParts').to(ServerResolveIndex).inSingletonScope();

export const Container = container;
